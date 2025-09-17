import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import { successResponse } from '../utils/apiUtils.js';
import { sendResetEmail } from '../services/emailService.js';

export const requestReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return successResponse(res, { }, 'If account exists, reset link sent');

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    await User.setResetToken(email, token, expiry);
    await sendResetEmail(email, token);
    return successResponse(res, { }, 'Reset link sent');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Request reset error:', err?.message || err);
    return next(AppError.internal('Could not process reset request'));
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findByResetToken(token);
    if (!user) return next(AppError.badRequest('Invalid or expired token'));

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.update(user.id, { ...user, password: hashed, resetToken: null, resetTokenExpiry: null });
    await User.clearResetToken(user.email);
    return successResponse(res, { }, 'Password updated successfully');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Reset password error:', err?.message || err);
    return next(AppError.internal('Password update failed. Please try again.'));
  }
};

export default { requestReset, resetPassword };


