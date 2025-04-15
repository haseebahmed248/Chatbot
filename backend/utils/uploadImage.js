import multer from "multer";
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine if we're in local development or production
const isProduction = process.env.NODE_ENV === 'production';

// Setup for local storage (development environment)
const uploadDir = path.join(__dirname, '..', 'data', 'Pictures');
if (!isProduction && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage based on environment
let storage;
if (isProduction) {
  // Use memory storage for production (Vercel)
  storage = multer.memoryStorage();
} else {
  // Use disk storage for local development
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });
}

const uploadImage = multer({ storage: storage });

// Function to handle file uploads
export const handleFileUpload = async (req) => {
  if (!req.file) return null;
  
  // For production, upload to Vercel Blob
  if (isProduction) {
    try {
      // Import is dynamic to avoid issues in development environment
      const { put } = await import('@vercel/blob');
      
      const blob = await put(
        `${Date.now()}-${req.file.originalname}`, 
        req.file.buffer, 
        { contentType: req.file.mimetype, access: 'public' }
      );
      
      return blob.url;
    } catch (error) {
      console.error("Error uploading to Vercel Blob:", error);
      throw error;
    }
  } 
  // For development, return the local path
  else {
    // Return the path relative to the root that can be accessed via your Express static middleware
    return `/data/Pictures/${req.file.filename}`;
  }
};

export default uploadImage;
