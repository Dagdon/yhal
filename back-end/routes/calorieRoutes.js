import express from 'express';
import { calculate as calculateNutrition } from '../controllers/calculateNutritionController.js';
import getFoodController from '../controllers/getFoodController.js';
import { validateNutritionInput } from '../middlewares/uploadMiddleware.js';
import { auth } from '../middlewares/authMiddleware.js';
import { apiLimiter } from '../config/rateLimiter.js';

const router = express.Router();

// Nutrition calculation route
router.post('/', validateNutritionInput, calculateNutrition);

// Meal history routes
router.get('/history', auth, apiLimiter, getFoodController.getHistory);

export default router;