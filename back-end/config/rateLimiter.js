import { RateLimiterRedis } from 'rate-limiter-flexible';
import redisClient from './redisConfig.js'; // Use your redis client
import AppError from './AppError.js';

const rateLimitConfigs = {
  // Strict limits for auth endpoints
  auth: {
    points: 5, // 5 attempts
    duration: 60 * 15, // 15 minutes
    blockDuration: 60 * 60, // 1 hour block if exceeded
  },
  // More generous for general API
  api: {
    points: 100, // 100 requests
    duration: 60 * 5, // 5 minutes
  },
  // Very strict for password reset
  passwordReset: {
    points: 3, // 3 attempts
    duration: 60 * 60, // 1 hour
    blockDuration: 60 * 60 * 24, // 24 hour block if exceeded
  },
};

// Create rate limiters
const limiters = {
  authLimiter: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl_auth',
    ...rateLimitConfigs.auth,
  }),
  apiLimiter: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl_api',
    ...rateLimitConfigs.api,
  }),
  passwordResetLimiter: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl_pwreset',
    ...rateLimitConfigs.passwordReset,
  }),
};

/**
 * Generic rate limit middleware
 */
const rateLimiter = (limiterType) => async (req, res, next) => {
  try {
    const limiter = limiters[limiterType];
    if (!limiter) throw new Error('Invalid rate limiter type');

    // Use IP + endpoint as key (or user ID if authenticated)
    const key = req.user?.id || req.ip;
    const routeKey = `${key}_${req.path}`;

    await limiter.consume(routeKey);
    next();
  } catch (error) {
    if (error instanceof Error) {
      return next(error);
    }

    // Rate limit exceeded
    const retryAfter = Math.ceil(error.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(retryAfter));

    return next(new AppError(
      'Too many requests. Please try again later.',
      429,
      {
        retryAfter,
        limit: error.remainingPoints,
        reset: new Date(Date.now() + error.msBeforeNext),
      },
    ));
  }
};

// Specific rate limiters
export const registerLimiter = rateLimiter('authLimiter');
export const loginLimiter = rateLimiter('authLimiter');
export const passwordResetLimiter = rateLimiter('passwordResetLimiter');
export const apiLimiter = rateLimiter('apiLimiter');

// Close Redis connection on shutdown
process.on('SIGTERM', async () => {
  await redisClient.quit();
});

export default {
  registerLimiter,
  loginLimiter,
  passwordResetLimiter,
  apiLimiter,
};
