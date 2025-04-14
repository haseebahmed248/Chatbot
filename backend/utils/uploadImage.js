import multer from "multer";
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//Util code for uploading an image.
const uploadDir = path.join(__dirname, '..', 'data', 'Pictures');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Upload destination folder
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Set a unique filename to avoid conflicts (timestamp + extension)
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const uploadImage = multer({ storage: storage });

export default uploadImage;