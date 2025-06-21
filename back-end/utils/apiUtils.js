import { rateLimit } from 'express-rate-limit';
import redis from 'redis';
import { createHash } from 'crypto';

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

// CACHING UTILITIES
let redisClient;

const initRedis = async () => {
  redisClient = redis.createClient();
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  await redisClient.connect();
};
await initRedis();

const generateCacheKey = (req) => {
  const {
    method, originalUrl, body, query,
  } = req;
  const keyData = {
    method, originalUrl, body, query,
  };
  return `cache:${createHash('md5').update(JSON.stringify(keyData)).digest('hex')}`;
};

export const checkCache = async (req, res, next) => {
  try {
    const key = generateCacheKey(req);
    const cachedData = await redisClient.get(key);

    if (cachedData) {
      return successResponse(res, JSON.parse(cachedData), 'Data served from cache');
    }

    req.cacheKey = key;
    return next();
  } catch (err) {
    return next(err);
  }
};

export const saveToCache = async (key, data, ttl = 3600) => {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(data));
  } catch (err) {
    console.error('Cache save error:', err);
  }
};

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

// PAGINATION UTILITIES
export const paginate = (totalItems, currentPage = 1, perPage = 10) => {
  const totalPages = Math.ceil(totalItems / perPage);

  return {
    totalItems,
    currentPage: Number(currentPage),
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
};

export const paginateResults = (data, page = 1, limit = 10) => {
  const startIdx = (page - 1) * limit;
  const endIdx = page * limit;

  return {
    pagination: paginate(data.length, page, limit),
    results: data.slice(startIdx, endIdx),
  };
};

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
