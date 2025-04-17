import multer from "multer";
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine if we're in production (Vercel) or development environment
const isProduction = process.env.NODE_ENV === 'production';

// Setup upload directory for local development
const uploadDir = path.join(__dirname, '..', 'data', 'Pictures');

// Create the directory if it doesn't exist (for local development)
if (!isProduction && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage strategy based on environment
let storage;

if (isProduction) {
  // In production (Vercel), use memory storage since we'll upload to Vercel Blob
  storage = multer.memoryStorage();
} else {
  // In development, use disk storage
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Generate unique filename with timestamp
      const uniqueFilename = `${Date.now()}${path.extname(file.originalname)}`;
      cb(null, uniqueFilename);
    },
  });
}

// Configure multer with appropriate storage and limits
const uploadImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  }
});

// Function to handle file uploads based on environment
export const handleFileUpload = async (req) => {
  if (!req.file) return null;
  
  // For production environment (Vercel)
  if (isProduction) {
    try {
      // Dynamically import Vercel Blob (only needed in production)
      const { put } = await import('@vercel/blob');
      
      // Upload to Vercel Blob
      const blob = await put(
        `${Date.now()}-${req.file.originalname}`, 
        req.file.buffer, 
        { access: 'public' }
      );
      
      // Return the Vercel Blob URL
      return blob.url;
    } catch (error) {
      console.error("Error uploading to Vercel Blob:", error);
      throw error;
    }
  } 
  // For local development
  else {
    // Calculate URL for local environment
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    
    // Return the local path to the file
    return `${baseUrl}/data/Pictures/${req.file.filename}`;
  }
};

export default uploadImage;