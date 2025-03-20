import jwt from 'jsonwebtoken'; // Library for generating and verifying JWTs
import dotenv from 'dotenv'; // Load environment variables from .env file

// Load environment variables
dotenv.config();

// Generate a JWT token
const generateToken = (userId) => {
  const payload = {
    userId, // Include user ID in the token payload
  };

  // Generate a token with a 1-hour expiration time
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
  return token;
};

// Verify a JWT token
const verifyToken = (req, res, next) => {
  // Get the token from the request headers
  const token = req.headers.authorization?.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // Attach the user ID to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Token verification failed:', error); // Log the error
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

// Check if the user is authenticated
const authMiddleware = (req, res, next) => {
  // Use the verifyToken middleware to check authentication
  verifyToken(req, res, next);
};

// Default export
export default authMiddleware;

// Named export for generateToken
export { generateToken };
