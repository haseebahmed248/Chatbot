import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const deleteImage = (imageUrl) => {
  try {
    // Extract filename from URL
    const filename = path.basename(imageUrl);
    const filePath = path.join(__dirname, '..', 'data', 'Pictures', filename);

    // Check if the file exists before attempting deletion
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);

    }
  } catch (error) {
    console.error(`Error deleting image: ${error.message}`);

  }
};

export default deleteImage;
