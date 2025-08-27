import express from 'express';
import { 
  calculateNutrition,
  getMealHistory,
  logMeal,
  deleteMealEntry
} from '../controllers/foodController';
import { validateNutritionInput } from '../middlewares/uploadMiddleware';
import { auth } from '../middlewares/authMiddleware';
import { apiLimiter } from '../config/rateLimiter';

const router = express.Router();

// Nutrition calculation route
router.post('/', validateNutritionInput, calculateNutrition);

// Meal history routes
router.get('/history', auth, apiLimiter, getMealHistory);
router.post('/log', auth, validateNutritionInput, logMeal);
router.delete('/log/:id', auth, deleteMealEntry);

export default router;