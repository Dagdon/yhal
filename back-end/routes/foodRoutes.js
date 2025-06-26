import express from 'express';
import {
  analyzeFoodImage,
  confirmFoodDetails,
  getFoods,
  getFoodById,
  calculateNutrition,
  handleFoodErrors,
} from '../controllers/foodController';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';
import { apiLimiter } from '../config/rateLimiter';

const router = express.Router();

// Food analysis routes
router.post('/analyze', uploadMiddleware, analyzeFoodImage);
router.post('/confirm', confirmFoodDetails);
router.post('/nutrition', calculateNutrition);

// Food history routes
router.get('/', apiLimiter, getFoods);
router.get('/:id', getFoodById);

// Error handling middleware
router.use(handleFoodErrors);

export default router;
