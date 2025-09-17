import express from 'express';
import { register as registerUser } from '../controllers/registerController.js';
import { login as loginUser, logout as logoutUser } from '../controllers/loginController.js';
import { requestReset as forgotPassword, resetPassword } from '../controllers/resetPasswordController.js';
import { authLimiter } from '../config/rateLimiter.js';

const router = express.Router();

// Authentication routes
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.get('/logout', logoutUser);

// Password recovery routes
router.post('/forgot-password', authLimiter, forgotPassword);
router.patch('/reset-password/:token', resetPassword);

// Email verification routes
// Deprecated verification routes are omitted as email validation is removed per spec

export default router;
