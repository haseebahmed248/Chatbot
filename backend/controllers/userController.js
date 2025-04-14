import encryptData from "../utils/encryptData.js";
import prisma from "../prisma/client.js";

export const getUsername = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    const encryptedResponse = encryptData({ message: "All fields are required." });
    return res.status(400).json({ data: encryptedResponse });
  }

  try {
    const user = await prisma.users.findUnique({
      where: {
        id: parseInt(userId)
      },
      select: {
        username: true
      }
    });
    
    if (!user) {
      const encryptedResponse = encryptData({ message: "User not found." });
      return res.status(404).json({ data: encryptedResponse });
    }
    
    const encryptedResponse = encryptData(user);
    return res.status(200).json({ data: encryptedResponse });
    
  } catch (error) {
    const encryptedResponse = encryptData({ message: error.message });
    return res.status(500).json({ data: encryptedResponse });
  }
};

export const updateUsername = async (req, res) => {
  const { userId, username } = req.body;

  if (!userId || !username) {
    const encryptedResponse = encryptData({ message: "All fields are required." });
    return res.status(400).json({ data: encryptedResponse });
  }

  try {
    await prisma.users.update({
      where: {
        id: parseInt(userId)
      },
      data: {
        username
      }
    });

    const encryptedResponse = encryptData({ message: "Success" });
    res.status(200).json({ data: encryptedResponse });

  } catch (error) {
    const encryptedResponse = encryptData({ message: error.message });
    res.status(500).json({ data: encryptedResponse });
  }
};

export const deleteUser = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    const encryptedResponse = encryptData({ message: "All fields are required." });
    return res.status(400).json({ data: encryptedResponse });
  }

  try {
    // Using a transaction to ensure all related data is deleted
    await prisma.$transaction(async (tx) => {
      // Delete all campaign images first
      const campaigns = await tx.campaigns.findMany({
        where: {
          user_id: parseInt(userId)
        },
        select: {
          id: true
        }
      });
      
      // Delete all campaign images for each campaign
      for (const campaign of campaigns) {
        await tx.campaignImages.deleteMany({
          where: {
            campaign_id: campaign.id
          }
        });
      }
      
      // Delete all campaigns
      await tx.campaigns.deleteMany({
        where: {
          user_id: parseInt(userId)
        }
      });
      
      // Finally delete the user
      await tx.users.delete({
        where: {
          id: parseInt(userId)
        }
      });
    });

    const encryptedResponse = encryptData({ message: "Success" });
    res.status(200).json({ data: encryptedResponse });
    
  } catch (error) {
    const encryptedResponse = encryptData({ message: error.message });
    res.status(500).json({ data: encryptedResponse });
  }
};