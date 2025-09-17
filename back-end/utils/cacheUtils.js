import { createHash } from 'crypto';
import redisClient from '../config/redisConfig.js';

let isRedisReady = false;

const ensureRedisConnection = async () => {
  if (isRedisReady) return;
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
      isRedisReady = true;
    } catch (err) {
      // Swallow connection errors here; callers should handle cache misses gracefully
      // eslint-disable-next-line no-console
      console.error('Redis connection failed in cacheUtils:', err);
    }
  } else {
    isRedisReady = true;
  }
};

export const generateCacheKey = (req) => {
  const { method, originalUrl, body, query } = req;
  const keyData = { method, originalUrl, body, query };
  return `cache:${createHash('md5').update(JSON.stringify(keyData)).digest('hex')}`;
};

export const getCache = async (key) => {
  try {
    await ensureRedisConnection();
    if (!redisClient.isOpen) return null;
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getCache error:', err);
    return null;
  }
};

export const setCache = async (key, data, ttlSeconds = 3600) => {
  try {
    await ensureRedisConnection();
    if (!redisClient.isOpen) return false;
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('setCache error:', err);
    return false;
  }
};

export default { generateCacheKey, getCache, setCache };


