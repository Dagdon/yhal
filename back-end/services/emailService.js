import nodemailer from 'nodemailer';

// Environment checks
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || !process.env.EMAIL_FROM) {
  throw new Error('Missing email configuration. Check your .env file.');
}

// Initialize rate limiting storage
const lastEmailTimestamps = new Map();
const RATE_LIMIT_MS = 60000; // 1 minute in milliseconds

const canSendEmail = (email) => {
  const lastSent = lastEmailTimestamps.get(email);
  if (!lastSent) return true;
  return (Date.now() - lastSent) > RATE_LIMIT_MS;
};

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendResetEmail = async (email, token) => {
  // Rate limit check
  if (!canSendEmail(email)) {
    console.warn(`Rate limited: Too many requests for ${email}`);
    throw new Error('Password reset emails can only be requested once per minute');
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
    : ''
}
			</body>
			</html>`,
      text: `To reset your password, visit: ${resetLink}\n\nThis link expires in 15 minutes.`,
    });

    // Update last sent timestamp
    lastEmailTimestamps.set(email, Date.now());
    console.log(`Reset email sent to ${email}`);
  } catch (error) {
    console.error('Email delivery failed:', error);
    throw new Error('Failed to send reset email. Please try again later.');
  }
};

export default { sendResetEmail };
