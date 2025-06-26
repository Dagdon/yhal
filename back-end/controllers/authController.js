import jwt from 'jsonwebtoken'; // For generating/verifying tokens
import bcrypt from 'bcrypt'; // For password hashing
import dotenv from 'dotenv'; // For environment variables
import User from '../models/userModel'; // User model
import { sendResetEmail, sendVerificationEmail } from '../services/emailService';

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

  // Handles user logout
  async logout(req, res) {
    try {
      return res.json({ message: 'Successfully logged out' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: 'Logout failed' });
    }
  },

  /*
   * Initiates password reset
   * 1. Generates reset token (valid 15 minutes)
   * 2. Saves token to user record
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

      // Send email with reset link
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

  /**
   * Verifies user email using verification token
   * 1. Validates verification token
   * 2. Marks user as verified
   * 3. Clears verification token
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;

      // Verify the token
      try {
        jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }

      // Find user by verification token
      const user = await User.findByVerificationToken(token);
      if (!user) {
        return res.status(400).json({ error: 'Invalid verification token' });
      }

      // Check if already verified
      if (user.isVerified) {
        return res.status(400).json({ error: 'Email already verified' });
      }

      // Mark user as verified and clear verification token
      await User.update(user.id, { isVerified: true });
      await User.clearVerificationToken(user.email);

      return res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Email verification error:', error);
      return res.status(500).json({ error: 'Email verification failed' });
    }
  },
  /**
   * Resends email verification
   * For users who haven't verified their email yet
   */
  async resendVerification(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findByEmail(email);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.isVerified) {
        return res.status(400).json({ error: 'Email already verified' });
      }

      // Generate verification token
      const verificationToken = jwt.sign(
        { email, userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: TOKEN_EXPIRATION },
      );

      // Save verification token
      await User.setVerificationToken(email, verificationToken);

      // Send verification email
      await sendVerificationEmail(email, verificationToken);

      return res.json({ message: 'Verification email sent' });
    } catch (error) {
      console.error('Resend verification error:', error);
      return res.status(500).json({ error: 'Could not resend verification email' });
    }
  },
};

// Named exports
export const registerUser = authController.register;
export const loginUser = authController.login;
export const logoutUser = authController.logout;
export const forgotPassword = authController.requestPasswordReset;
export const { resetPassword } = authController;
export const { resendVerification } = authController;
export const { verifyEmail } = authController;

// Default export
export default authController;
