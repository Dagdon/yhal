import { rateLimit } from 'express-rate-limit';
import redis from 'redis';
import { createHash } from 'crypto';

// API RESPONSE HANDLERS

export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
};

export const errorResponse = (res, message, statusCode = 400, code = 'API_ERROR') => {
  return res.status(statusCode).json({
    status: 'error',
    code,
    message,
  });
};

// RATE LIMIT CONFIGURATIONS

/**
 * Strict rate limiter for image processing endpoints
 */

export const strictImageLimiter = rateLimit({
  windowMs: 5 * 1000, // 5-second window
  max: 1, // 1 request per window
  message: 'Too many image uploads. Please wait 5 seconds.',
  standardHeaders: true,
  skip: (req) => req.user?.isPremium, // Skip for premium users
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many API requests from this IP',
  standardHeaders: true,
});

// CACHING UTILITIES

// Initialize Redis client
let redisClient;

const initRedis = async () => {
  redisClient = redis.createClient();
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  await redisClient.connect();
};
await initRedis();

/**
 * Generate cache key from request parameters
 * @param {Object} req - Express request object
 * @returns {string} - Generated cache key
 */
const generateCacheKey = (req) => {
  const { method, originalUrl, body, query } = req;
  const keyData = { method, originalUrl, body, query };
  return `cache:${createHash('md5').update(JSON.stringify(keyData)).digest('hex')}`;
};

// Middleware to check cache before processing
export const checkCache = async (req, res, next) => {
  try {
    const key = generateCacheKey(req);
    const cachedData = await redisClient.get(key);

    if (cachedData) {
      return successResponse(res, JSON.parse(cachedData), 'Data served from cache');
    }

    req.cacheKey = key; // Attach key for later use
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Save data to cache
 * @param {string} key - Cache key
 *  @param {Object} data - Data to cache
 *  @param {number} [ttl=3600] - Time-to-live in seconds
 */
export const saveToCache = async (key, data, ttl = 3600) => {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(data));
  } catch (err) {
    console.error('Cache save error:', err);
  }
};

// REQUEST VALIDATION MIDDLEWARE

/**
 * Validates API key header
 */
export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return errorResponse(res, 'Invalid or missing API key', 401);
  }

  next();
};

/**
 * Validates African region parameter
 */
export const validateRegion = (req, res, next) => {
  const validRegions = ['west', 'east', 'north', 'south', 'central'];

  if (req.query.region && !validRegions.includes(req.query.region.toLowerCase())) {
    return errorResponse(res, `Invalid region. Must be one of: ${validRegions.join(', ')}`, 400);
  }

  next();
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

/**
 * Applies pagination to query results
 * @param {Array} data - Full dataset
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Paginated results
 */
export const paginateResults = (data, page = 1, limit = 10) => {
  const startIdx = (page - 1) * limit;
  const endIdx = page * limit;

  return {
    pagination: paginate(data.length, page, limit),
    results: data.slice(startIdx, endIdx),
  };
};

export default {
  // Response handlers
  successResponse,
  errorResponse,

  // Rate limiting
  strictImageLimiter,
  apiRateLimiter,

  // Caching
  checkCache,
  saveToCache,

  // Validation
  validateApiKey,
  validateRegion,

  // Pagination
  paginate,
  paginateResults,
};
