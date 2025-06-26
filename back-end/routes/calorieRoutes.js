import express from 'express';
import { calculateNutrition } from '../controllers/foodController';
import { validateNutritionInput } from '../middlewares/uploadMiddleware';

const router = express.Router();

router.post('/', validateNutritionInput, calculateNutrition);

export default router;
