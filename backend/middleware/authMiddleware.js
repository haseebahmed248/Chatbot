import jwt from "jsonwebtoken";
import prisma from '../prisma/client.js';
import encryptData from '../utils/encryptData.js';
import dotenv from "dotenv";

dotenv.config();

export const authenticateToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access Denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid Token" });
  }
};




// Middleware to verify JWT token and attach user to request
export const verifyToken = async (req, res, next) => {
  const { token } = req.body;
  
  if (!token) {
    const encryptedResponse = encryptData({ message: "Authentication token is required" });
    return res.status(401).json({ data: encryptedResponse });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the user
    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        is_verified: true,
        credits: true
      }
    });
    
    if (!user) {
      const encryptedResponse = encryptData({ message: "User not found" });
      return res.status(404).json({ data: encryptedResponse });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    
    // Handle token verification errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      const encryptedResponse = encryptData({ message: "Invalid or expired token" });
      return res.status(401).json({ data: encryptedResponse });
    }
    
    // Handle other errors
    const encryptedResponse = encryptData({ message: "Server error" });
    return res.status(500).json({ data: encryptedResponse });
  }
};

// Middleware to check if user is an admin
export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    const encryptedResponse = encryptData({ message: "Access denied. Admin privileges required." });
    return res.status(403).json({ data: encryptedResponse });
  }
  
  next();
};

// Middleware to check if user is verified
export const isVerifiedUser = (req, res, next) => {
  if (!req.user || !req.user.is_verified) {
    const encryptedResponse = encryptData({ message: "Access denied. Account verification required." });
    return res.status(403).json({ data: encryptedResponse });
  }
  
  next();
};

// Middleware to check if user has access to a campaign (either owner or admin)
export const hasCampaignAccess = async (req, res, next) => {
  const { campaignId } = req.body;
  const userId = req.user.id;
  
  if (!campaignId) {
    const encryptedResponse = encryptData({ message: "Campaign ID is required." });
    return res.status(400).json({ data: encryptedResponse });
  }
  
  try {
    const campaign = await prisma.campaigns.findUnique({
      where: { id: parseInt(campaignId) }
    });
    
    if (!campaign) {
      const encryptedResponse = encryptData({ message: "Campaign not found." });
      return res.status(404).json({ data: encryptedResponse });
    }
    
    // Allow access if user is the owner or is an admin
    if (campaign.user_id === userId || req.user.role === 'ADMIN') {
      req.campaign = campaign;
      next();
    } else {
      const encryptedResponse = encryptData({ message: "Access denied. You don't have permission to access this campaign." });
      return res.status(403).json({ data: encryptedResponse });
    }
  } catch (error) {
    console.error("Campaign access error:", error);
    const encryptedResponse = encryptData({ message: error.message });
    return res.status(500).json({ data: encryptedResponse });
  }
};