// backend/config/db.js
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Load environment variables from .env file
dotenv.config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test connection on startup
export const healthCheck = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    return false;
  }
};

// Test connection on startup (non-fatal in dev)
(async () => {
  const ok = await healthCheck();
  if (ok) {
    // eslint-disable-next-line no-console
    console.log('✅ Database connected successfully');
  } else {
    // eslint-disable-next-line no-console
    console.error('❌ Database connection failed');
    if (process.env.NODE_ENV === 'production') process.exit(1);
  }
})();

// Export the pool
export default pool;