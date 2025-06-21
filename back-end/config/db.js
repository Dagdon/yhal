// backend/config/db.js
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

//  Export database configuration
export default {
  host: process.env.DB_HOST, // Database host
  user: process.env.DB_USER, // Database user
  password: process.env.DB_PASSWORD, // Database password
  database: process.env.DB_NAME, // Database name
};
