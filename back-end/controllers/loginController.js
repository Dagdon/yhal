import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import { successResponse } from '../utils/apiUtils.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return next(AppError.unauthorized());

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return next(AppError.unauthorized());

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
    return successResponse(res, { token, userId: user.id, expiresIn: process.env.JWT_EXPIRES_IN || '15m' }, 'Login successful');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Login error:', err?.message || err);
    return next(AppError.internal('Login failed'));
  }
};

export const logout = async (req, res) => successResponse(res, { }, 'Logged out');

export default { login, logout };


