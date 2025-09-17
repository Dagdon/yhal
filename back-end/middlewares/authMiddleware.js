import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const generateToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });

export const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId || decoded.user?.id || decoded.id };
    return next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Token verification failed:', error?.message || error);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export default auth;
