import { RateLimiterRedis } from 'rate-limiter-flexible';
import redisClient from './redisConfig';
import AppError from '../utils/AppError';

const rateLimitConfigs = {
  auth: {
    points: 5,
    duration: 60 * 15,
    blockDuration: 60 * 60,
  },
  api: {
    points: 100,
    duration: 60 * 5,
  },
  passwordReset: {
    points: 3,
    duration: 60 * 60,
    blockDuration: 60 * 60 * 24,
  },
};

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

const rateLimiter = (limiterType) => async (req, res, next) => {
  try {
    const limiter = limiters[limiterType];
    if (!limiter) throw new Error('Invalid rate limiter type');

    const key = req.user?.id || req.ip;
    const routeKey = `${key}_${req.path}`;

    await limiter.consume(routeKey);
    return next(); // Added return
  } catch (error) {
    if (error instanceof Error) {
      return next(error); // Added return
    }

    const retryAfter = Math.ceil(error.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(retryAfter));

    return next(new AppError( // Added return
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

export const registerLimiter = rateLimiter('authLimiter');
export const loginLimiter = rateLimiter('authLimiter');
export const passwordResetLimiter = rateLimiter('passwordResetLimiter');
export const apiLimiter = rateLimiter('apiLimiter');

process.on('SIGTERM', async () => {
  await redisClient.quit();
});

export default {
  registerLimiter,
  loginLimiter,
  passwordResetLimiter,
  apiLimiter,
};
