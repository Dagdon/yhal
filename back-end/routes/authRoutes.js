import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  resendVerification,
  verifyEmail,
} from '../controllers/authController';
import { authLimiter } from '../config/rateLimiter';

const router = express.Router();

// Authentication routes
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.get('/logout', logoutUser);

// Password recovery routes
router.post('/forgot-password', authLimiter, forgotPassword);
router.patch('/reset-password/:token', resetPassword);

// Email verification routes
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', authLimiter, resendVerification);

export default router;
