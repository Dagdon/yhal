import jwt from 'jsonwebtoken'; // For generating/verifying tokens
import bcrypt from 'bcrypt'; // For password hashing
import dotenv from 'dotenv'; // For environment variables
import User from '../models/user.js'; // User model
import { sendResetEmail } from '../services/emailService.js';

dotenv.config(); // Load .env variables

// Constants for token expiration (15 minutes in milliseconds)
const TOKEN_EXPIRATION = '15m';
const TOKEN_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

const authController = {
  /**
   * Handles user registration
   * Hashes password
   * Creates user
   * Generates JWT
   */
  async register(req, res) {
    try {
      const {
        firstName, lastName, email, password,
      } = req.body;

      // Hash password with bcrypt (10 salt rounds)
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user in database
      const userId = await User.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
      });

      // Generate JWT valid for 15min
      const token = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: TOKEN_EXPIRATION },
      );

      return res.status(201).json({ token });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Registration failed' });
    }
  },

  /*
   * Handles user login
   * 1. Verifies credentials
   * 2. Generates JWT
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Compare hashed passwords
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: TOKEN_EXPIRATION },
      );

      return res.json({
        token,
        userId: user.id,
        expiresIn: TOKEN_EXPIRATION_MS,
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Login failed' });
    }
  },

  /*
   * Initiates password reset
   * 1. Generates reset token (valid 15 minutes)
   * 2. Saves token to user record
   * Note: In production, you would send an email with the token
   */
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findByEmail(email);

      if (!user) {
        // Don't reveal if user exists for security
        return res.json({ message: 'If account exists, reset link sent' });
      }

      // Generate token valid for 15 minutes
      const resetToken = jwt.sign(
        { email },
        process.env.JWT_SECRET,
        { expiresIn: TOKEN_EXPIRATION },
      );
      const expiry = new Date(Date.now() + TOKEN_EXPIRATION_MS); // 15 minutes from now

      // Save token to database
      await User.setResetToken(email, resetToken, expiry);

      // In production: Send email with reset link
      await sendResetEmail(email, resetToken);

      return res.json({ message: 'Reset link sent' });
    } catch (error) {
      console.error('Password reset error:', error);
      return res.status(500).json({ error: 'Could not process reset request' });
    }
  },

  /**
   * Completes password reset
   * 1. Validates reset token
   * 2. Updates password
   * 3. Clears used token
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      // Verify token exists and hasn't expired
      const user = await User.findByResetToken(token);
      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      await User.update(user.id, { password: hashedPassword });
      await User.clearResetToken(user.email);
      return res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Password reset error:', error);
      return res.status(500).json({ error: 'Password update failed. Please try again.' });
    }
  },
};

export default authController;
