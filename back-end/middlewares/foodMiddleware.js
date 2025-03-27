// Validate food data
const validateFoodData = (req, res, next) => {
  const { name, ingredients, calories } = req.body;

  // Check if required fields are provided
  if (!name || !ingredients || !calories) {
    return res.status(400).json({ message: 'Name, ingredients, and calories are required.' });
  }

  // Check if calories is a number
  if (typeof calories !== 'number' || calories <= 0) {
    return res.status(400).json({ message: 'Calories must be a positive number.' });
  }

  // If validation passes, proceed to the next middleware or route handler
  next();
};

// Process food images (example: resize or compress images)
const processFoodImage = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No food image uploaded.' });
  }

  // Example: Log the file details (you can replace this with actual image processing logic)
  console.log('Uploaded food image:', req.file);

  // Proceed to the next middleware or route handler
  next();
};

// Check if the user is authorized to modify food entries
const checkFoodPermissions = (req, res, next) => {
  const { role } = req.user; // Assuming user role is attached to the request object

  // Only allow admins or specific roles to modify food entries
  if (role !== 'admin') {
    return res.status(403).json({ message: 'You are not authorized to perform this action.' });
  }

  // If authorized, proceed to the next middleware or route handler
  next();
};

// Export the middleware functions
export { validateFoodData, processFoodImage, checkFoodPermissions };

export const validateImageFile = (file) => {
  if (!file) throw new Error('No file provided');
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only JPEG/PNG allowed');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size exceeds 5MB limit');
  }
};
