import sanitizeHtml from 'sanitize-html';
import calculateNutrition from '../services/calorieService.js';
import { validatePortionSize, validateIngredients, validateFoodName, validateRegion } from '../utils/validationUtils.js';
import { successResponse } from '../utils/apiUtils.js';
import { generateCacheKey, getCache, setCache } from '../utils/cacheUtils.js';

export const calculate = async (req, res, next) => {
  try {
    const { ingredients, foodName, regionalOrigin, portion } = req.body;
    validateIngredients(ingredients);
    validateFoodName(foodName);
    validateRegion(regionalOrigin);
    validatePortionSize(portion);

    const sanitized = {
      ingredients: ingredients.map((i) => sanitizeHtml(i)),
      foodName: sanitizeHtml(foodName),
      regionalOrigin: sanitizeHtml(regionalOrigin),
    };

    const key = generateCacheKey({
      method: 'POST',
      originalUrl: '/api/calculate',
      body: { ...sanitized, portion },
      query: {},
    });

    const cached = await getCache(key);
    if (cached) return successResponse(res, cached, 'Nutrition served from cache');

    const result = await calculateNutrition(sanitized.foodName, sanitized.ingredients, sanitized.regionalOrigin);
    const data = { ...sanitized, portion, ...result };
    await setCache(key, data, 86400);
    return successResponse(res, data, 'Nutrition information calculated');
  } catch (err) {
    return next(err);
  }
};

export default { calculate };


