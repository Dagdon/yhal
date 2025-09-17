import { rateLimit } from 'express-rate-limit';
import { generateCacheKey, getCache, setCache } from './cacheUtils.js';
import { paginateArray, buildPagination } from './paginationUtils.js';

// API RESPONSE HANDLERS
export const successResponse = (res, data, message = 'Success', statusCode = 200) => res.status(statusCode).json({
  status: 'success',
  message,
  data,
});

export const errorResponse = (res, message, statusCode = 400, code = 'API_ERROR') => res.status(statusCode).json({
  status: 'error',
  code,
  message,
});

// RATE LIMIT CONFIGURATIONS
export const strictImageLimiter = rateLimit({
  windowMs: 5 * 1000,
  max: 1,
  message: 'Too many image uploads. Please wait 5 seconds.',
  standardHeaders: true,
  skip: (req) => req.user?.isPremium,
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this user',
  standardHeaders: true,
});

// CACHING UTILITIES (delegated to cacheUtils)
export const checkCache = async (req, res, next) => {
  try {
    const key = generateCacheKey(req);
    const cachedData = await getCache(key);
    if (cachedData) {
      return successResponse(res, cachedData, 'Data served from cache');
    }
    req.cacheKey = key;
    return next();
  } catch (err) {
    return next(err);
  }
};

export const saveToCache = async (key, data, ttl = 3600) => setCache(key, data, ttl);

// VALIDATION MIDDLEWARE
export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return errorResponse(res, 'Invalid or missing API key', 401);
  }

  return next();
};

export const validateRegion = (req, res, next) => {
  const validRegions = ['west', 'east', 'north', 'south', 'central'];

  if (req.query.region && !validRegions.includes(req.query.region.toLowerCase())) {
    return errorResponse(res, `Invalid region. Must be one of: ${validRegions.join(', ')}`, 400);
  }

  return next();
};

// PAGINATION UTILITIES (delegated to paginationUtils)
export const paginate = buildPagination;
export const paginateResults = paginateArray;

export default {
  successResponse,
  errorResponse,
  strictImageLimiter,
  apiRateLimiter,
  checkCache,
  saveToCache,
  validateApiKey,
  validateRegion,
  paginate,
  paginateResults,
};
