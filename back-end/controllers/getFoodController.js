import { successResponse } from '../utils/apiUtils.js';
import { getCache, setCache } from '../utils/cacheUtils.js';
import pool, { healthCheck as dbHealth } from '../config/db.js';
import { healthCheck as redisHealth } from '../config/redisConfig.js';

export const getFood = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'anon';
    const cacheKey = `food:${userId}:${id}`;
    const cached = await getCache(cacheKey);
    if (cached) return successResponse(res, cached, 'Food details served from cache');

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT id, name, ingredients, calories, image_path FROM foods WHERE id = ? LIMIT 1',
        [id]
      );
      if (!rows[0]) return successResponse(res, { }, 'Food not found');
      const food = { ...rows[0], ingredients: JSON.parse(rows[0].ingredients || '[]') };
      await setCache(cacheKey, food, 3600);
      return successResponse(res, food, 'Food retrieved');
    } finally {
      connection.release();
    }
  } catch (err) {
    return next(err);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT ml.id, ml.consumed_at, f.name, f.ingredients, f.calories
         FROM meal_log ml JOIN foods f ON ml.food_id = f.id
         WHERE ml.user_id = ? ORDER BY ml.consumed_at DESC LIMIT 50`,
        [userId]
      );
      const history = rows.map((r) => ({ ...r, ingredients: JSON.parse(r.ingredients || '[]') }));
      return successResponse(res, { history }, 'Meal history');
    } finally {
      connection.release();
    }
  } catch (err) {
    return next(err);
  }
};

export const getStatus = async (req, res) => {
  const [redisOk, dbOk] = await Promise.all([redisHealth(), dbHealth()]);
  const status = {
    api: 'healthy',
    redis: redisOk ? 'healthy' : 'unhealthy',
    database: dbOk ? 'healthy' : 'unhealthy',
  };
  const overall = Object.values(status).every((s) => s === 'healthy') ? 'healthy' : 'degraded';
  return successResponse(res, { services: status, overall }, `System is ${overall}`);
};

export const getRegions = async (req, res, next) => {
  try {
    const regions = [
      { id: 'west-africa', name: 'West Africa' },
      { id: 'east-africa', name: 'East Africa' },
      { id: 'north-africa', name: 'North Africa' },
      { id: 'central-africa', name: 'Central Africa' },
      { id: 'southern-africa', name: 'Southern Africa' },
    ];
    return successResponse(res, { regions, total: regions.length }, 'African regions retrieved successfully');
  } catch (err) {
    return next(err);
  }
};

export default { getFood, getHistory, getStatus, getRegions };


