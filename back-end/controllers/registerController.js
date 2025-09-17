import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import { successResponse, errorResponse } from '../utils/apiUtils.js';

// Registers users: receives name, email, password and hashes password
export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return errorResponse(res, 'firstName, lastName, email and password are required', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await User.create({ firstName, lastName, email, password: hashedPassword });

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });

    return successResponse(res, { token, userId }, 'Registration successful', 201);
  } catch (err) {
    // Friendly logging for operators, friendly message for users
    // eslint-disable-next-line no-console
    console.error('Register error:', err?.message || err);
    if (err?.code === 'ER_DUP_ENTRY') {
      return next(AppError.conflict('An account with this email already exists'));
    }
    return next(AppError.internal('Could not complete registration'));
  }
};

export default { register };


