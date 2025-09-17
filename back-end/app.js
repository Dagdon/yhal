import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRouter from './routes/authRoutes.js';
import foodRouter from './routes/foodRoutes.js';
import calorieRouter from './routes/calorieRoutes.js';
import utilityRouter from './routes/utilityRoutes.js';
import AppError from './utils/appError.js';

dotenv.config();

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later',
});

// Application Middlewares
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/foods', foodRouter);
app.use('/api/v1/nutrition', apiLimiter, calorieRouter);
app.use('/api/v1/utils', utilityRouter);

// Health Check
app.get('/ping', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// 404 Handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error Handler (Using your AppError)
// Centralized error handler with user-friendly responses
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  res.status(statusCode).json({
    status,
    message: err.message || 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' ? { details: err.details, stack: err.stack } : {}),
  });
});

export default app;
