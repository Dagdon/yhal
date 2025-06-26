import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Environment checks
const requiredEnvVars = ['EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM', 'FRONTEND_URL'];
requiredEnvVars.forEach((env) => {
  if (!process.env[env]) throw new Error(`Missing ${env} in .env configuration`);
});

// Rate limiting storage
const lastEmailTimestamps = new Map();
const RATE_LIMIT_MS = 60000; // 1 minute cooldown

const transporter = nodemailer.createTransporter({
  service: process.env.EMAIL_SERVICE || 'gmail', // Fallback to Gmail
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendResetEmail = async (email, token) => {
  // Rate limit check
  const lastSent = lastEmailTimestamps.get(email);
  if (lastSent && Date.now() - lastSent < RATE_LIMIT_MS) {
    throw new Error('Email requests are rate limited to once per minute');
  }

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  try {
    await transporter.sendMail({
      from: `"Yhal Support" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #4a6baf;
      color: white !important;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h2 style="color: #4a6baf; text-align: center;">Password Reset</h2>
  <p>Click below to reset your password:</p>
  <div style="text-align: center;">
    <a href="${resetLink}" class="button">Reset Password</a>
  </div>
  <p><small>This link expires in 15 minutes.</small></p>
  ${process.env.SUPPORT_EMAIL
    ? `<p>Need help? Contact <a href="mailto:${process.env.SUPPORT_EMAIL}">${process.env.SUPPORT_EMAIL}</a></p>`
    : ''}
</body>
</html>`,
      text: `To reset your password, visit: ${resetLink}\n\nThis link expires in 15 minutes.`,
    });

    lastEmailTimestamps.set(email, Date.now());
    return true;
  } catch (error) {
    console.error('Email delivery failed:', error);
    throw new Error('EMAIL_DELIVERY_FAILED');
  }
};

const sendVerificationEmail = async (email, token) => {
  // Rate limit check
  const lastSent = lastEmailTimestamps.get(`verify_${email}`);
  if (lastSent && Date.now() - lastSent < RATE_LIMIT_MS) {
    throw new Error('Email requests are rate limited to once per minute');
  }

  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  try {
    await transporter.sendMail({
      from: `"Yhal Support" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #4a6baf;
      color: white !important;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h2 style="color: #4a6baf; text-align: center;">Welcome to Yhal!</h2>
  <p>Thank you for registering with Yhal. Please verify your email address to complete your account setup.</p>
  <div style="text-align: center;">
    <a href="${verificationLink}" class="button">Verify Email Address</a>
  </div>
  <p><small>This link expires in 15 minutes.</small></p>
  <p>If you didn't create an account with Yhal, you can safely ignore this email.</p>
  ${process.env.SUPPORT_EMAIL
    ? `<p>Need help? Contact <a href="mailto:${process.env.SUPPORT_EMAIL}">${process.env.SUPPORT_EMAIL}</a></p>`
    : ''}
</body>
</html>`,
      text: `Welcome to Yhal!\n\nTo verify your email address, visit: ${verificationLink}\n\nThis link expires in 15 minutes.\n\nIf you didn't create an account with Yhal, you can safely ignore this email.`,
    });

    lastEmailTimestamps.set(`verify_${email}`, Date.now());
    return true;
  } catch (error) {
    console.error('Verification email delivery failed:', error);
    throw new Error('EMAIL_DELIVERY_FAILED');
  }
};

export { sendResetEmail, sendVerificationEmail };
export default { sendResetEmail, sendVerificationEmail };
