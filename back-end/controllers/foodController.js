// Import required modules and services
import aiService from './aiService.js';
import calorieService from './calorieService.js';
import { validateImageFile, validatePortionSize } from './validationUtils.js';
import multer from 'multer';
import redis from 'redis';
import { createHash } from 'crypto';
import { rateLimit } from 'express-rate-limit';
import uploadMiddleware from './uploadMiddleware.js';
import { validateFoodData, processFoodImage, checkFoodPermissions } from './foodMiddleware.js';

// Initialize Redis client for caching
const connectRedis = async () => {
  const client = redis.createClient();
  client.on('error', (err) => console.log('Redis Client Error', err));
  await client.connect();
  return client;
};
const redisClient = await connectRedis();

// Rate limiting configuration
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit each IP to 30 requests per hour
  message: 'Too many requests from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
});

const analysisLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 seconds
  max: 1, // Limit each IP to 1 request per 5 seconds
  message: 'Please wait 5 seconds between food analysis requests',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware chain for image upload and processing
const uploadFoodImageChain = [
  checkFoodPermissions, // First check permissions
  uploadMiddleware,     // Then handle file upload
  processFoodImage,      // Then process the image
];

const foodController = {
  // Analyze food image and predict ingredients with rate limiting
  analyzeFoodImage: [
    ...uploadFoodImageChain, // Include upload middleware chain
    analysisLimiter,         // Then apply rate limiting
    async (req, res, next) => {
      try {
        // The middleware chain should have processed the file and attached it to req.file
        validateImageFile(req.file);

        // Create cache key from image hash and user ID
        const cacheKey = `food:${req.user?.id || 'anon'}:${createHash('md5')
          .update(req.file.buffer)
          .digest('hex')}`;

        // Check cache first
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return res.status(200).json(JSON.parse(cached));
        }

        // Call AI service if not cached
        const { predictedIngredients, predictedName, predictedOrigin } = await aiService.predictIngredients(req.file);

        // Cache results for 1 hour
        const responseData = {
          status: 'success',
          data: {
            foodName: predictedName,
            regionalOrigin: predictedOrigin,
            ingredients: predictedIngredients,
            message: 'Please confirm or modify the details',
          },
        };
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData));

        res.status(200).json(responseData);
      } catch (error) {
        next(error);
      }
    },
  ],

  // Calculate nutrition with portion control
  calculateNutrition: [
    validateFoodData, // Validate input data first
    apiLimiter,       // Then apply rate limiting
    async (req, res, next) => {
      try {
        const { ingredients, foodName, regionalOrigin, portionSize } = req.body;
        validatePortionSize(portionSize);

        // Create cache key from ingredients hash and portion
        const ingredientsHash = createHash('md5')
          .update(JSON.stringify({ ingredients, portionSize }))
          .digest('hex');
        const cacheKey = `nutrition:${ingredientsHash}`;

        // Check cache first
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return res.status(200).json(JSON.parse(cached));
        }

        // Calculate if not cached
        const nutritionInfo = await calorieService.calculateNutrition(
          ingredients,
          portionSize,
          regionalOrigin,
        );

        // Cache results for 24 hours
        const responseData = {
          status: 'success',
          data: {
            foodName,
            regionalOrigin,
            portionSize,
            ...nutritionInfo,
            message: 'Nutrition information calculated',
          },
        };
        await redisClient.setEx(cacheKey, 86400, JSON.stringify(responseData));

        res.status(200).json(responseData);
      } catch (error) {
        next(error);
      }
    },
  ],

  // Handle errors from other middleware/controllers specific to food processing
  handleFoodErrors(err, req, res, next) {
    // Handle specific error types for food processing
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

    // Handle multer errors specifically
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        status: 'fail',
        message: `File upload error: ${err.message}`,
      });
    }

    // Pass to default error handler if not a food-specific error
    next(err);
  },
};

export default foodController;
