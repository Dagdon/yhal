import express from 'express';
import { analyseFoodImage } from '../controllers/analyseFoodImageController.js';
import { calculate as calculateNutrition } from '../controllers/calculateNutritionController.js';
import getFoodController from '../controllers/getFoodController.js';
import { uploadMiddleware } from '../middlewares/uploadMiddleware.js';
import { apiLimiter } from '../config/rateLimiter.js';
import { auth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Food analysis routes
router.post('/analyze', uploadMiddleware, analyseFoodImage);
router.post('/nutrition', calculateNutrition);

// Food retrieval and status
router.get('/:id', auth, getFoodController.getFood);
router.get('/', auth, apiLimiter, getFoodController.getHistory);
router.get('/system/status', getFoodController.getStatus);

export default router;