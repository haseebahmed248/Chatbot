import CryptoJS from "crypto-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get the encryption key from environment variables
const encryptionKey = process.env.ENCRYPTION_SECRET_KEY;

// Check if the encryption key is set
if (!encryptionKey) {
  console.warn("WARNING: ENCRYPTION_SECRET_KEY is not set in environment variables!");
  console.warn("Using fallback key for development only. This is NOT secure for production!");
}

// Use the environment variable or a fallback for development
const key = encryptionKey || "fallback-development-key-not-for-production";

const decryptData = (encryptedData) => {
  try {
    // Decrypt the data
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    
    // Convert to string and parse JSON
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    
    // Parse JSON string back to object
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
};

export default decryptData;