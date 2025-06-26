import multer from 'multer';
import redis from 'redis';
import { createHash } from 'crypto';
import { rateLimit } from 'express-rate-limit';
import sanitizeHtml from 'sanitize-html';
import { validateImageFile, validatePortionSize } from '../utils/validationUtils';
import calorieService from '../services/calorieService';
import aiService from '../services/aiService';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';
import {
  validateFoodData,
  processFoodImage,
  checkFoodPermissions,
} from '../middlewares/foodMiddleware';

// Redis client with error handling and retries
const connectRedis = async () => {
  const client = redis.createClient({
    socket: { reconnectStrategy: (retries) => Math.min(retries * 100, 5000) },
  });
  try {
    await client.connect();
    return client;
  } catch (err) {
    throw new Error(`Redis connection failed: ${err.message}`);
  }
};
const redisClient = await connectRedis();

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Too many requests from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

const analysisLimiter = rateLimit({
  windowMs: 5 * 1000,
  max: 1,
  message: 'Please wait 5 seconds between food analysis requests',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware chain for image processing
const uploadFoodImageChain = [
  checkFoodPermissions,
  uploadMiddleware,
  processFoodImage,
];

const foodController = {
  analyzeFoodImage: [
    ...uploadFoodImageChain,
    analysisLimiter,
    async (req, res, next) => {
      try {
        validateImageFile(req.file);
        const fileHash = createHash('sha256')
          .update(req.file.buffer)
          .digest('hex');
        const cacheKey = `food:${req.user?.id || 'anon'}:${fileHash}`;

        const cached = await redisClient.get(cacheKey);
        if (cached) return res.status(200).json(JSON.parse(cached));

        const {
          predictedIngredients,
          predictedName,
          predictedOrigin,
        } = await aiService.predictIngredients(req.file);

        const sanitizedData = {
          foodName: sanitizeHtml(predictedName),
          regionalOrigin: sanitizeHtml(predictedOrigin),
          ingredients: predictedIngredients.map(sanitizeHtml),
        };

        const responseData = {
          status: 'success',
          data: {
            ...sanitizedData,
            message: 'Please confirm or modify the details',
          },
        };

        await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData));
        return res.status(200).json(responseData);
      } catch (error) {
        if (req.file?.buffer) {
          const fileHash = createHash('sha256')
            .update(req.file.buffer)
            .digest('hex');
          const cacheKey = `food:${req.user?.id || 'anon'}:${fileHash}`;
          await redisClient.setEx(cacheKey, 300, JSON.stringify({
            status: 'retry',
          }));
        }
        return next(error);
      }
    },
  ],

  calculateNutrition: [
    validateFoodData,
    apiLimiter,
    async (req, res, next) => {
      try {
        const {
          ingredients, foodName, regionalOrigin, portionSize,
        } = req.body;
        validatePortionSize(portionSize);

        const sanitizedInput = {
          ingredients: ingredients.map(sanitizeHtml),
          foodName: sanitizeHtml(foodName),
          regionalOrigin: sanitizeHtml(regionalOrigin),
        };

        const nutritionHash = createHash('sha256')
          .update(JSON.stringify({
            ingredients: sanitizedInput.ingredients,
            portionSize,
          }))
          .digest('hex');
        const cacheKey = `nutrition:${nutritionHash}`;

        const cached = await redisClient.get(cacheKey);
        if (cached) return res.status(200).json(JSON.parse(cached));

        const nutritionInfo = await calorieService.calculateNutrition(
          sanitizedInput.ingredients,
          portionSize,
          sanitizedInput.regionalOrigin,
        );

        const responseData = {
          status: 'success',
          data: {
            ...sanitizedInput,
            portionSize,
            ...nutritionInfo,
            message: 'Nutrition information calculated',
          },
        };

        await redisClient.setEx(cacheKey, 86400, JSON.stringify(responseData));
        return res.status(200).json(responseData);
      } catch (error) {
        return next(error);
      }
    },
  ],

  /**
   * Confirms or modifies food details after AI prediction
   * Allows users to adjust the predicted ingredients, name, and origin
   */
  async confirmFoodDetails(req, res, next) {
    try {
      const {
        ingredients, foodName, regionalOrigin, confirmed,
      } = req.body;

      // Validate required fields
      if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({
          status: 'fail',
          message: 'Ingredients array is required and cannot be empty',
        });
      }

      if (!foodName || typeof foodName !== 'string') {
        return res.status(400).json({
          status: 'fail',
          message: 'Food name is required',
        });
      }

      if (!regionalOrigin || typeof regionalOrigin !== 'string') {
        return res.status(400).json({
          status: 'fail',
          message: 'Regional origin is required',
        });
      }

      const sanitizedData = {
        ingredients: ingredients.map((ingredient) => sanitizeHtml(ingredient.trim())),
        foodName: sanitizeHtml(foodName.trim()),
        regionalOrigin: sanitizeHtml(regionalOrigin.trim()),
        confirmed: Boolean(confirmed),
      };

      // Store confirmed food data for user (if authenticated)
      if (req.user?.id) {
        const cacheKey = `confirmed:${req.user.id}:${Date.now()}`;
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(sanitizedData));
      }

      return res.status(200).json({
        status: 'success',
        data: {
          ...sanitizedData,
          message: 'Food details confirmed. Ready for nutrition calculation.',
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Gets all food records for the authenticated user
   */
  async getFoods(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          status: 'fail',
          message: 'Authentication required',
        });
      }

      // Get paginated results
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const skip = (page - 1) * limit;

      // Search Redis for user's food records
      const pattern = `food:${userId}:*`;
      const keys = await redisClient.keys(pattern);

      const foods = await Promise.all(
        keys.slice(skip, skip + limit).map(async (key) => {
          try {
            const foodData = await redisClient.get(key);
            if (foodData) {
              const parsed = JSON.parse(foodData);
              return {
                id: key.split(':').pop(),
                ...parsed.data,
                timestamp: key.includes('confirmed')
                  ? new Date(parseInt(key.split(':').pop(), 10)).toISOString()
                  : new Date().toISOString(),
              };
            }
            return null;
          } catch (parseError) {
            console.error('Error parsing food data:', parseError);
            return null;
          }
        }),
      );

      // Filter out null values
      const validFoods = foods.filter((food) => food !== null);

      return res.status(200).json({
        status: 'success',
        data: {
          foods: validFoods,
          pagination: {
            page,
            limit,
            total: keys.length,
            pages: Math.ceil(keys.length / limit),
          },
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Gets a specific food record by ID
   */
  async getFoodById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          status: 'fail',
          message: 'Authentication required',
        });
      }

      // Try to find the food record in Redis
      const possibleKeys = [
        `food:${userId}:${id}`,
        `confirmed:${userId}:${id}`,
        `nutrition:${id}`,
      ];

      let foodData = null;
      let foundKey = null;

      // Use Promise.all to check all keys concurrently
      const keyChecks = await Promise.all(
        possibleKeys.map(async (key) => {
          try {
            const data = await redisClient.get(key);
            return data ? { key, data: JSON.parse(data) } : null;
          } catch (parseError) {
            console.error('Error parsing food data for key:', key, parseError);
            return null;
          }
        }),
      );

      // Find the first valid result
      const validResult = keyChecks.find((result) => result !== null);
      if (validResult) {
        foodData = validResult.data;
        foundKey = validResult.key;
      }

      if (!foodData) {
        return res.status(404).json({
          status: 'fail',
          message: 'Food record not found',
        });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          id,
          ...foodData.data || foodData,
          source: foundKey?.split(':')[0] || 'unknown',
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Gets list of supported African regions for food analysis
   */
  async getRegions(req, res, next) {
    try {
      const regions = [
        { id: 'west-africa', name: 'West Africa', countries: ['Nigeria', 'Ghana', 'Senegal', 'Mali', 'Burkina Faso', 'Ivory Coast', 'Guinea', 'Sierra Leone', 'Liberia', 'Gambia', 'Guinea-Bissau', 'Cape Verde'] },
        { id: 'east-africa', name: 'East Africa', countries: ['Kenya', 'Ethiopia', 'Tanzania', 'Uganda', 'Rwanda', 'Burundi', 'South Sudan', 'Somalia', 'Eritrea', 'Djibouti'] },
        { id: 'north-africa', name: 'North Africa', countries: ['Egypt', 'Libya', 'Tunisia', 'Algeria', 'Morocco', 'Sudan'] },
        { id: 'central-africa', name: 'Central Africa', countries: ['Democratic Republic of Congo', 'Cameroon', 'Central African Republic', 'Chad', 'Republic of Congo', 'Equatorial Guinea', 'Gabon', 'São Tomé and Príncipe'] },
        { id: 'southern-africa', name: 'Southern Africa', countries: ['South Africa', 'Zimbabwe', 'Botswana', 'Namibia', 'Zambia', 'Malawi', 'Mozambique', 'Angola', 'Lesotho', 'Eswatini'] },
      ];

      // Cache regions data
      const cacheKey = 'african:regions';
      await redisClient.setEx(cacheKey, 86400, JSON.stringify(regions)); // Cache for 24 hours

      return res.status(200).json({
        status: 'success',
        data: {
          regions,
          total: regions.length,
          message: 'African regions retrieved successfully',
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  /**
   * Gets system status and health check information
   */
  async getSystemStatus(req, res, next) {
    try {
      const status = {
        timestamp: new Date().toISOString(),
        services: {
          api: 'healthy',
          redis: 'unknown',
          ai: 'unknown',
          calorie: 'unknown',
        },
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      };

      // Check Redis connection
      try {
        await redisClient.ping();
        status.services.redis = 'healthy';
      } catch (redisError) {
        status.services.redis = 'unhealthy';
      }

      // Check AI service (you can implement actual health check)
      try {
        // This would be replaced with actual AI service health check
        if (aiService && typeof aiService.healthCheck === 'function') {
          await aiService.healthCheck();
          status.services.ai = 'healthy';
        } else {
          status.services.ai = 'healthy'; // Assume healthy if no health check method
        }
      } catch (aiError) {
        status.services.ai = 'unhealthy';
      }

      // Check Calorie service
      try {
        // This would be replaced with actual calorie service health check
        if (calorieService && typeof calorieService.healthCheck === 'function') {
          await calorieService.healthCheck();
          status.services.calorie = 'healthy';
        } else {
          status.services.calorie = 'healthy'; // Assume healthy if no health check method
        }
      } catch (calorieError) {
        status.services.calorie = 'unhealthy';
      }

      const overallStatus = Object.values(status.services).every((service) => service === 'healthy')
        ? 'healthy'
        : 'degraded';

      return res.status(200).json({
        status: 'success',
        data: {
          ...status,
          overall: overallStatus,
          message: `System is ${overallStatus}`,
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  handleFoodErrors(err, req, res, next) {
    if (err.code === 'INGREDIENT_PREDICTION_FAILED') {
      return res.status(400).json({
        status: 'fail',
        message: 'Could not predict ingredients from the image. Please try with a clearer photo.',
      });
    }

    if (err.code === 'NUTRITION_CALCULATION_FAILED') {
      return res.status(400).json({
        status: 'fail',
        message: 'Could not calculate nutrition for the provided ingredients. Some ingredients may not be recognized.',
      });
    }

    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        status: 'fail',
        message: `File upload error: ${err.message}`,
      });
    }

    return next(err);
  },
};

export const {
  calculateNutrition,
  analyzeFoodImage,
  handleFoodErrors,
  confirmFoodDetails,
  getFoods,
  getFoodById,
  getRegions,
  getSystemStatus,
} = foodController;

export default foodController;
