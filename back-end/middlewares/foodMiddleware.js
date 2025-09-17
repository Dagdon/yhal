// Middleware for validating food data
const validateFoodData = (req, res, next) => {
  const { foodName, regionalOrigin, ingredients, nutrients, calories } = req.body;
  if (!foodName || typeof foodName !== 'string') {
    return res.status(400).json({ message: 'Food name is required.' });
  }
  if (!regionalOrigin || typeof regionalOrigin !== 'string') {
    return res.status(400).json({ message: 'Regional origin is required.' });
  }
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ message: 'Ingredients must be a non-empty array.' });
  }
  if (nutrients && (typeof nutrients !== 'object' || nutrients === null)) {
    return res.status(400).json({ message: 'Nutrients must be an object if provided.' });
  }
  if (calories !== undefined && (typeof calories !== 'number' || calories <= 0)) {
    return res.status(400).json({ message: 'Calories must be a positive number if provided.' });
  }
  return next();
};

// Middleware for processing food images
const processFoodImage = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No food image uploaded.' });
  }

  console.log('Uploaded food image:', req.file);
  return next(); // Added return
};

// Middleware for checking food permissions
const checkFoodPermissions = (req, res, next) => next();

// Image file validator now comes from utils/validationUtils; keep named export for compatibility
import { validateImageFile as validateImageFileUtil } from '../utils/validationUtils.js';
const validateImageFile = (file) => validateImageFileUtil(file);

export {
  validateFoodData, processFoodImage, checkFoodPermissions, validateImageFile,
};
