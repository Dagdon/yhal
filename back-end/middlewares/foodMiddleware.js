// Middleware for validating food data
const validateFoodData = (req, res, next) => {
  const { name, ingredients, calories } = req.body;

  if (!name || !ingredients || !calories) {
    return res.status(400).json({ message: 'Name, ingredients, and calories are required.' });
  }

  if (typeof calories !== 'number' || calories <= 0) {
    return res.status(400).json({ message: 'Calories must be a positive number.' });
  }

  return next(); // Added return
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
const checkFoodPermissions = (req, res, next) => {
  const { role } = req.user;

  if (role !== 'admin') {
    return res.status(403).json({ message: 'You are not authorized to perform this action.' });
  }

  return next(); // Added return
};

// Image file validator
const validateImageFile = (file) => {
  if (!file) throw new Error('No file provided');

  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only JPEG/PNG allowed');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size exceeds 5MB limit');
  }
};

export {
  validateFoodData, processFoodImage, checkFoodPermissions, validateImageFile,
};
