export const createRateLimiter = (windowMs, max, message) =>
  rateLimit({ windowMs, max, message, standardHeaders: true });
