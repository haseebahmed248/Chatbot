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

const encryptData = (data) => {
  try {
    // Convert data to string if it's not already
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Encrypt the data
    return CryptoJS.AES.encrypt(dataString, key).toString();
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
};

export default encryptData;