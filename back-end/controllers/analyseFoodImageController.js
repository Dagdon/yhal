import { createHash } from 'crypto';
import sanitizeHtml from 'sanitize-html';
import aiPredict from '../services/aiService.js';
import { validateImageFile } from '../utils/validationUtils.js';
import { successResponse } from '../utils/apiUtils.js';
import { getCache, setCache } from '../utils/cacheUtils.js';

export const analyseFoodImage = async (req, res, next) => {
  try {
    validateImageFile(req.file);
    const fileHash = createHash('sha256').update(req.file.buffer).digest('hex');
    const cacheKey = `foodscan:${req.user?.id || 'anon'}:${fileHash}`;

    const cached = await getCache(cacheKey);
    if (cached) return successResponse(res, cached, 'Data served from cache');

    const { predictedName, predictedOrigin, predictedIngredients } = await aiPredict(req.file.buffer);
    const data = {
      foodName: sanitizeHtml(predictedName),
      regionalOrigin: sanitizeHtml(predictedOrigin),
      ingredients: predictedIngredients.map((i) => sanitizeHtml(i)),
    };
    await setCache(cacheKey, data, 3600);
    return successResponse(res, data, 'Please confirm or modify the details');
  } catch (err) {
    return next(err);
  }
};

export default { analyseFoodImage };


