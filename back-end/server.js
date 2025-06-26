import mysql from 'mysql2/promise';
import app from './app.js';
import redisClient from './config/redisConfig.js';

const PORT = process.env.PORT || 5000;

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test Database Connection
const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    connection.release();

    // Initialize Redis
    await redisClient.connect();
    console.log('✅ Redis connected successfully');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
};

// Start Server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  connectDB();
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

// Export pool for use in models
export default { pool };
