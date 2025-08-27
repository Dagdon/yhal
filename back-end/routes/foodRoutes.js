import express from 'express';
import {
  analyzeFoodImage,
  confirmFoodDetails,
  getFoods,
  getFoodById,
  calculateNutrition,
  handleFoodErrors,
  getCachedFoods,
  processFoodScan,
  getRegions,
  getSystemStatus
} from '../controllers/foodController';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';
import { apiLimiter } from '../config/rateLimiter';
import { auth } from '../middlewares/authMiddleware';

const router = express.Router();

// Food analysis routes
router.post('/analyze', uploadMiddleware, analyzeFoodImage);
router.post('/confirm', confirmFoodDetails);
router.post('/nutrition', calculateNutrition);

// Cached food suggestions routes
router.get('/cached', auth, apiLimiter, getCachedFoods);
router.post('/scan', auth, uploadMiddleware, processFoodScan);

// Food history routes
router.get('/', auth, apiLimiter, getFoods);
router.get('/:id', auth, getFoodById);

// Additional utility routes
router.get('/regions', getRegions);
router.get('/system/status', getSystemStatus);

// Error handling middleware
router.use(handleFoodErrors);

export default router;