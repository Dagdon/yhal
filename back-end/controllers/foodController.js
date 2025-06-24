import multer from 'multer';
import redis from 'redis';
import { createHash } from 'crypto';
import { rateLimit } from 'express-rate-limit';
import sanitizeHtml from 'sanitize-html';
import { validateImageFile, validatePortionSize } from './validationUtils';
import calorieService from '../services/calorieService';
import aiService from '../services/aiService';
import uploadMiddleware from '../middlewares/uploadMiddleware';
import { validateFoodData, processFoodImage, checkFoodPermissions } from '../middlewares/foodMiddleware';

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
        const cacheKey = `food:${req.user?.id || 'anon'}:${
          createHash('sha256').update(req.file.buffer).digest('hex')
        }`;

        const cached = await redisClient.get(cacheKey);
        if (cached) return res.status(200).json(JSON.parse(cached));

        const { predictedIngredients, predictedName, predictedOrigin } = await aiService.predictIngredients(req.file);

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
          const cacheKey = `food:${req.user?.id || 'anon'}:${
            createHash('sha256').update(req.file.buffer).digest('hex')
          }`;
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

        const cacheKey = `nutrition:${
          createHash('sha256').update(
            JSON.stringify({ ingredients: sanitizedInput.ingredients, portionSize }),
          ).digest('hex')
        }`;

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

    return next(err); // Added return
  },
};

export default foodController;
