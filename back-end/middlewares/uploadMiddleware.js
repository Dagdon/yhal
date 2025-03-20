import multer from 'multer'; // Middleware for handling multipart/form-data (file uploads)
import path from 'path'; // Utility for working with file paths

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save uploaded files to the 'uploads' directory
  },
  filename: (req, file, cb) => {
    // Generate a unique filename using the current timestamp and original file extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
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

// Default export
export default uploadMiddleware;
