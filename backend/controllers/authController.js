import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import encryptData from "../utils/encryptData.js";
import prisma from "../prisma/client.js";

dotenv.config();

// Token expiration times (in seconds)
const ACCESS_TOKEN_EXPIRY = 3600; // 1 hour
const REFRESH_TOKEN_EXPIRY = 30 * 24 * 3600; // 30 days

// Helper function to generate tokens
const generateTokens = async (userId) => {
  // Generate access token (short-lived)
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  // Generate refresh token (long-lived)
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + REFRESH_TOKEN_EXPIRY);

  // Store refresh token in database
  await prisma.refresh_tokens.create({
    data: {
      user_id: userId,
      token: refreshToken,
      expires_at: expiresAt
    }
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiry: Date.now() + ACCESS_TOKEN_EXPIRY * 1000,
    refreshTokenExpiry: expiresAt.getTime()
  };
};

// Register User
export const register = async (req, res) => {
  const { username, email, password } = req.body.formData;

  if (!username || !email || !password) {
    const encryptedResponse = encryptData({ message: "All fields are required." });
    return res.status(400).json({ data: encryptedResponse });
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      const encryptedResponse = encryptData({ message: "Email already in use." });
      return res.status(400).json({ data: encryptedResponse });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if this is the first user in the system, make them admin if so
    const userCount = await prisma.users.count();
    const isFirstUser = userCount === 0;
    
    const user = await prisma.users.create({
      data: {
        username,
        email,
        password: hashedPassword,
        credits: 10, // Start with 10 free credits
        role: isFirstUser ? 'ADMIN' : 'USER', // First user is admin
        is_verified: isFirstUser ? true : false, // First user is auto-verified
      },
      select: {
        id: true,
        username: true,
        email: true,
        credits: true,
        role: true,
        is_verified: true
      }
    });

    // Add a credit transaction record for the initial credits
    await prisma.credit_transactions.create({
      data: {
        user_id: user.id,
        amount: 10,
        description: "Welcome bonus credits",
        transaction_type: "bonus"
      }
    });

    // Generate tokens
    const tokens = await generateTokens(user.id);
    
    const encryptedResponse = encryptData({
      message: isFirstUser 
        ? "Admin account created. You have been automatically verified."
        : "User registered. Your account is pending verification by an admin.",
      user,
      ...tokens
    });
    res.status(200).json({ data: encryptedResponse });

  } catch (error) {
    console.error("Registration error:", error);
    const encryptedResponse = encryptData({ message: error.message });
    res.status(500).json({ data: encryptedResponse });
  }
};

// Login User
export const login = async (req, res) => {
  const { email, password } = req.body.formData;
  
  try {
    const user = await prisma.users.findUnique({
      where: { email }
    });
    
    if (!user) {
      const encryptedResponse = encryptData({ message: "User not found" });
      return res.status(400).json({ data: encryptedResponse });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const encryptedResponse = encryptData({ message: "Invalid credentials" });
      return res.status(400).json({ data: encryptedResponse });
    }

    // Update last login time
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    });

    // Generate tokens
    const tokens = await generateTokens(user.id);

    const encryptedResponse = encryptData({ 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        credits: user.credits,
        role: user.role,
        is_verified: user.is_verified
      },
      ...tokens
    });
    
    return res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("Login error:", error);
    const encryptedResponse = encryptData({ message: error.message });
    return res.status(500).json({ data: encryptedResponse });
  }
};

// Refresh Token
export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    const encryptedResponse = encryptData({ message: "Refresh token is required" });
    return res.status(400).json({ data: encryptedResponse });
  }
  
  try {
    // Find the refresh token in the database
    const tokenRecord = await prisma.refresh_tokens.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });
    
    // Check if token exists and is valid
    if (!tokenRecord) {
      const encryptedResponse = encryptData({ message: "Invalid refresh token" });
      return res.status(401).json({ data: encryptedResponse });
    }
    
    // Check if token is expired
    if (new Date() > tokenRecord.expires_at) {
      // Delete the expired token
      await prisma.refresh_tokens.delete({
        where: { id: tokenRecord.id }
      });
      
      const encryptedResponse = encryptData({ message: "Refresh token expired" });
      return res.status(401).json({ data: encryptedResponse });
    }
    
    // Delete the used refresh token
    await prisma.refresh_tokens.delete({
      where: { id: tokenRecord.id }
    });
    
    // Generate new tokens
    const tokens = await generateTokens(tokenRecord.user_id);
    
    // Return the new tokens
    const encryptedResponse = encryptData({
      user: { 
        id: tokenRecord.user.id, 
        username: tokenRecord.user.username, 
        email: tokenRecord.user.email,
        credits: tokenRecord.user.credits,
        role: tokenRecord.user.role,
        is_verified: tokenRecord.user.is_verified
      },
      ...tokens
    });
    
    return res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("Token refresh error:", error);
    const encryptedResponse = encryptData({ message: error.message });
    return res.status(500).json({ data: encryptedResponse });
  }
};

// Get User
export const getUser = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      const encryptedResponse = encryptData({ message: "Token is required" });
      return res.status(400).json({ data: encryptedResponse });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Query the database for user info
    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        credits: true,
        role: true,
        is_verified: true,
        last_login: true
      }
    });
    
    if (!user) {
      const encryptedResponse = encryptData({ message: "User not found" });
      return res.status(404).json({ data: encryptedResponse });
    }
    console.log('user: ',user)
    // Return the user data
    const encryptedResponse = encryptData({ user });
    return res.status(200).json({ data: encryptedResponse });

  } catch (error) {
    console.error("Error in getUser:", error);
    
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

// Logout User
export const logout = async (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    if (refreshToken) {
      // Delete refresh token from the database
      await prisma.refresh_tokens.deleteMany({
        where: { token: refreshToken }
      });
    }
    
    const encryptedResponse = encryptData({ message: "Logged out successfully" });
    return res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("Logout error:", error);
    const encryptedResponse = encryptData({ message: error.message });
    return res.status(500).json({ data: encryptedResponse });
  }
};