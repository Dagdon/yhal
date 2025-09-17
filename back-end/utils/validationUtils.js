import AppError from './appError.js';

export const validateImageFile = (file) => {
  if (!file) {
    throw new AppError('No image file provided', 400);
  }
  // Check file type: must be an image and not a vector/unsupported type
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    throw new AppError('File must be an image type', 400);
  }
  const disallowedMimeTypes = ['image/svg+xml'];
  if (disallowedMimeTypes.includes(file.mimetype)) {
    throw new AppError('SVG images are not allowed', 400);
  }
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new AppError('Only JPEG, PNG, JPG, or WEBP images are allowed', 400);
  }
  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new AppError('Image size exceeds 5MB limit', 400);
  }
  // Prevent thumbnails: reject very small files and common thumbnail naming
  const minSize = 10 * 1024; // 10KB
  if (file.size < minSize) {
    throw new AppError('Thumbnail-sized images are not allowed', 400);
  }
  const filename = file.originalname || '';
  if (/thumb|thumbnail|small/i.test(filename)) {
    throw new AppError('Thumbnail images are not allowed', 400);
  }
};

/**
 * Validates ingredients array
 * @param {Array} ingredients - Array of ingredients
 * @throws {AppError} - If validation fails
 */
export const validateIngredients = (ingredients) => {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new AppError('Ingredients must be a non-empty array', 400);
  }

  for (let i = 0; i < ingredients.length; i += 1) {
    const ing = ingredients[i];
    if (!ing.name || typeof ing.name !== 'string') {
      throw new AppError('Each ingredient must have a name string', 400);
    }
    if (!ing.amount || typeof ing.amount !== 'number' || ing.amount <= 0) {
      throw new AppError('Each ingredient must have a positive amount', 400);
    }
  }
};

/**
 * Validates portion size object
 * @param {Object} portion - Portion size object
 * @throws {AppError} - If validation fails
 */
export const validatePortionSize = (portion) => {
  if (!portion || typeof portion !== 'object') {
    throw new AppError('Portion size is required', 400);
  }
  const validTypes = ['standard', 'weight', 'volume', 'pieces'];
  if (!validTypes.includes(portion.type)) {
    throw new AppError(`Portion type must be one of: ${validTypes.join(', ')}`, 400);
  }
  if (portion.type === 'weight' && portion.unit !== 'g') {
    throw new AppError('Weight portions must be in grams (g)', 400);
  }
  if (!portion.value || typeof portion.value !== 'number' || portion.value <= 0) {
    throw new AppError('Portion must have a positive numeric value', 400);
  }
};

/**
 * Validates African food name
 * @param {String} name - Food name
 * @throws {AppError} - If validation fails
 */
export const validateFoodName = (name) => {
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    throw new AppError('Valid food name is required', 400);
  }
};

/**
 * Validates regional origin
 * @param {String} origin - Regional origin
 * @throws {AppError} - If validation fails
 */
export const validateRegion = (origin) => {
  const validRegions = ['West', 'East', 'North', 'South', 'Central'];
  if (!validRegions.includes(origin)) {
    throw new AppError(`Region must be one of: ${validRegions.join(', ')}`, 400);
  }
};

export default {
  validateImageFile,
  validateIngredients,
  validatePortionSize,
  validateFoodName,
  validateRegion,
};
