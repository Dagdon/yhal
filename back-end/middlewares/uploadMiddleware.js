import multer from 'multer'; // Middleware for handling multipart/form-data (file uploads)
import path from 'path'; // Utility for working with file paths

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save uploaded files to the 'uploads' directory
  },
  filename: (req, file, cb) => {
    // Generate a unique filename using the current timestamp and original file extension
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileExtension = path.extname(file.originalname);
    cb(null, uniqueSuffix + fileExtension);
  },
});

// File filter to allow only image files
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg']; // Allowed image formats
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Only JPEG, PNG, and JPG images are allowed!'), false); // Reject the file
  }
};

// Configure multer with storage and file filter
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
  },
});

// Middleware to handle single file uploads
const uploadMiddleware = upload.single('image'); // 'image' is the field name for the uploaded file

// Validation middleware for nutrition input
const validateNutritionInput = (req, res, next) => {
  const {
    ingredients, foodName, regionalOrigin, portionSize,
  } = req.body;

  // Check if required fields are present
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Ingredients array is required and cannot be empty',
    });
  }

  if (!foodName || typeof foodName !== 'string' || foodName.trim() === '') {
    return res.status(400).json({
      status: 'fail',
      message: 'Food name is required',
    });
  }

  if (!regionalOrigin || typeof regionalOrigin !== 'string' || regionalOrigin.trim() === '') {
    return res.status(400).json({
      status: 'fail',
      message: 'Regional origin is required',
    });
  }

  if (!portionSize || typeof portionSize !== 'number' || portionSize <= 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Valid portion size is required',
    });
  }

  // Validate ingredients array
  for (let i = 0; i < ingredients.length; i += 1) {
    if (typeof ingredients[i] !== 'string' || ingredients[i].trim() === '') {
      return res.status(400).json({
        status: 'fail',
        message: `Ingredient at index ${i} must be a non-empty string`,
      });
    }
  }

  return next();
};

// Named exports
export { validateNutritionInput, uploadMiddleware };

// Default export
export default uploadMiddleware;
