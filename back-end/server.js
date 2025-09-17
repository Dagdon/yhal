import app from './app.js';
import pool from './config/db.js';
import redisClient, { ensureRedis } from './config/redisConfig.js';

const PORT = process.env.PORT || 5000;

// Warm up connections
const warmUp = async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log('✅ MySQL connected successfully');
    await ensureRedis();
    console.log('✅ Redis connected successfully');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
};

// Start Server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  warmUp();
});

// Graceful Shutdown
const shutdown = async () => {
  console.log('🛑 Shutting down gracefully...');
  await pool.end();
  await redisClient.quit();
  server.close(() => {
    console.log('🔴 Server terminated');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default server;
