import express from "express";
import cors from "cors";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import protectedRoutes from "./routes/protectedRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import creditRoutes from "./routes/creditRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import encryptData from "./utils/encryptData.js";
import decryptData from "./utils/decryptData.js";
import uploadImage from "./utils/uploadImage.js";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Improved CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['*','http://localhost:3000', 'http://127.0.0.1:3000','https://ad-genie.vercel.app'],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use('/data', express.static(`${__dirname}/data`));

// Add this to your app.js, BEFORE the main encrypted gateway
app.post("/api/verifyCampaign", async (req, res) => {
  try {
    return campaignRoutes(req, res, "verifyCampaign");
  } catch (error) {
    console.error("Error in verify campaign:", error);
    return res.status(500).json({ message: error.message || "An error occurred" });
  }
});
app.post('/api/buildCampaign', async(req,res)=>{
  try {
    return campaignRoutes(req, res, "buildCampaign");
  } catch (error) {
    console.error("Error in Build campaign:", error);
    return res.status(500).json({ message: error.message || "An error occurred" });
  }
})
app.put('/api/updateCampaignStatus', async(req,res)=>{
  try {
    return campaignRoutes(req, res, "updateCampaignStatus");
  } catch (error) {
    console.error("Error in Update campaign Status:", error);
    return res.status(500).json({ message: error.message || "An error occurred" });
  }
})

// Single gateway for all API requests
app.post("/", async (req, res) => {
  // Handling the image upload in case of APIs that handle images
  if (req.headers['x-bypass-encryption'] === 'true') {
    try {
      const module = req.headers['x-module'];
      const endpoint = req.headers['x-endpoint'];
      
      if (module === 'campaigns' && endpoint === 'verifyCampaign') {
        return campaignRoutes(req, res, endpoint);
      }
    } catch (error) {
      console.error("Error processing unencrypted request:", error);
      return res.status(500).json({ message: error.message || "An error occurred" });
    }
  }
  uploadImage.single("image")(req, res, async (err) => {
    // Handle file upload errors
    if (err) {
      console.error("File upload error:", err);
      return res.status(400).json({ 
        data: encryptData({ message: "File upload error: " + err.message }) 
      });
    }
    
    try {
      // Check for payload
      if (!req.body || !req.body.payload) {
        return res.status(400).json({ 
          data: encryptData({ message: "Missing payload" }) 
        });
      }
      
      // Decrypt the incoming request
      let module, endpoint, data;
      try {
        const decrypted = decryptData(req.body.payload);
        module = decrypted.module;
        endpoint = decrypted.endpoint;
        data = decrypted.data;
      } catch (decryptError) {
        console.error("Decryption error:", decryptError);
        return res.status(400).json({ 
          data: encryptData({ message: "Failed to decrypt request" }) 
        });
      }

      // Set req.body = data for controllers
      req.body = data;

      // Route to the correct module
      switch (module) {
        case "auth":
          return authRoutes(req, res, endpoint);
          
        case "campaigns":
          return campaignRoutes(req, res, endpoint);
          
        case "payment":
          return paymentRoutes(req, res, endpoint);
          
        case "protected":
          return protectedRoutes(req, res, endpoint);
          
        case "user":
          return userRoutes(req, res, endpoint);
          
        case "credits":
          return creditRoutes(req, res, endpoint);
          
        case "admin": // New module for admin functionality
          return adminRoutes(req, res, endpoint);
          
        default:
          const encryptedResponse = encryptData({ message: "Invalid module" });
          return res.status(400).json({ data: encryptedResponse });
      }
    } catch (error) {
      console.error("Error processing request:", error);
      
      const encryptedResponse = encryptData({ 
        message: error.message || "An error occurred",
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      });
      
      return res.status(500).json({ data: encryptedResponse });
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}.`));
