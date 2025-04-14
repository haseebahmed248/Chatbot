import encryptData from "../utils/encryptData.js";
import prisma from "../prisma/client.js";

// Get user credits
export const getUserCredits = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    const encryptedResponse = encryptData({ message: "User ID is required." });
    return res.status(400).json({ data: encryptedResponse });
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id: parseInt(userId) },
      select: { credits: true }
    });

    if (!user) {
      const encryptedResponse = encryptData({ message: "User not found." });
      return res.status(404).json({ data: encryptedResponse });
    }

    const encryptedResponse = encryptData({ credits: user.credits });
    return res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("Error fetching user credits:", error);
    const encryptedResponse = encryptData({ message: error.message });
    return res.status(500).json({ data: encryptedResponse });
  }
};

// Get credit transaction history
export const getCreditHistory = async (req, res) => {
  const { userId, limit = 10, offset = 0 } = req.body;

  if (!userId) {
    const encryptedResponse = encryptData({ message: "User ID is required." });
    return res.status(400).json({ data: encryptedResponse });
  }

  try {
    // Get total count for pagination
    const totalCount = await prisma.credit_transactions.count({
      where: { user_id: parseInt(userId) }
    });
    
    // Get transactions with pagination
    const transactions = await prisma.credit_transactions.findMany({
      where: { user_id: parseInt(userId) },
      orderBy: { created_at: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    const encryptedResponse = encryptData({
      transactions,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalCount > (parseInt(offset) + parseInt(limit))
      }
    });
    
    return res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("Error fetching credit history:", error);
    const encryptedResponse = encryptData({ message: error.message });
    return res.status(500).json({ data: encryptedResponse });
  }
};

// Add credits from payment (simulated for now)
export const addCredits = async (req, res) => {
  const { userId, amount, paymentMethod = "dummy" } = req.body;

  if (!userId || !amount) {
    const encryptedResponse = encryptData({ message: "User ID and amount are required." });
    return res.status(400).json({ data: encryptedResponse });
  }

  if (parseInt(amount) <= 0) {
    const encryptedResponse = encryptData({ message: "Amount must be positive." });
    return res.status(400).json({ data: encryptedResponse });
  }

  try {
    // Start a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // First add the transaction record
      const transaction = await prisma.credit_transactions.create({
        data: {
          user_id: parseInt(userId),
          amount: parseInt(amount),
          description: `Added ${amount} credits via ${paymentMethod}`,
          transaction_type: "payment",
          payment_id: `payment_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        }
      });
      
      // Then update the user's credits
      const updatedUser = await prisma.users.update({
        where: { id: parseInt(userId) },
        data: {
          credits: {
            increment: parseInt(amount)
          }
        },
        select: { credits: true }
      });
      
      return { transaction, updatedUser };
    });
    
    const encryptedResponse = encryptData({
      message: `Successfully added ${amount} credits`,
      newBalance: result.updatedUser.credits,
      transaction: result.transaction
    });
    
    return res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("Error adding credits:", error);
    const encryptedResponse = encryptData({ message: error.message });
    return res.status(500).json({ data: encryptedResponse });
  }
};

// Use credits (deduct from balance)
export const useCredits = async (req, res) => {
  const { userId, amount, reason } = req.body;

  if (!userId || !amount || !reason) {
    const encryptedResponse = encryptData({ message: "User ID, amount, and reason are required." });
    return res.status(400).json({ data: encryptedResponse });
  }

  if (parseInt(amount) <= 0) {
    const encryptedResponse = encryptData({ message: "Amount must be positive." });
    return res.status(400).json({ data: encryptedResponse });
  }

  try {
    // Check if user has enough credits
    const user = await prisma.users.findUnique({
      where: { id: parseInt(userId) },
      select: { credits: true }
    });

    if (!user) {
      const encryptedResponse = encryptData({ message: "User not found." });
      return res.status(404).json({ data: encryptedResponse });
    }

    if (user.credits < parseInt(amount)) {
      const encryptedResponse = encryptData({ 
        message: "Insufficient credits", 
        currentBalance: user.credits,
        required: parseInt(amount)
      });
      return res.status(400).json({ data: encryptedResponse });
    }

    // Start a transaction to deduct credits
    const result = await prisma.$transaction(async (prisma) => {
      // First add the transaction record (negative amount for deduction)
      const transaction = await prisma.credit_transactions.create({
        data: {
          user_id: parseInt(userId),
          amount: -parseInt(amount),
          description: reason,
          transaction_type: "usage"
        }
      });
      
      // Then update the user's credits
      const updatedUser = await prisma.users.update({
        where: { id: parseInt(userId) },
        data: {
          credits: {
            decrement: parseInt(amount)
          }
        },
        select: { credits: true }
      });
      
      return { transaction, updatedUser };
    });
    
    const encryptedResponse = encryptData({
      message: `Successfully used ${amount} credits`,
      newBalance: result.updatedUser.credits,
      transaction: result.transaction
    });
    
    return res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("Error using credits:", error);
    const encryptedResponse = encryptData({ message: error.message });
    return res.status(500).json({ data: encryptedResponse });
  }
};