import encryptData from "../utils/encryptData.js";
import prisma from "../prisma/client.js";
import deleteImage from "../utils/deleteImage.js";

// Get all users (paginated)
export const getAllUsers = async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.body;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  try {
    // Build search condition
    const whereCondition = search ? {
      OR: [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    } : {};
    
    // Get total count for pagination
    const totalUsers = await prisma.users.count({
      where: whereCondition
    });
    
    // Get users with pagination
    const users = await prisma.users.findMany({
      where: whereCondition,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        is_verified: true,
        credits: true,
        last_login: true,
        created_at: true,
        _count: {
          select: {
            campaigns: true
          }
        }
      },
      skip,
      take: parseInt(limit),
      orderBy: { created_at: 'desc' }
    });
    
    // Format response
    const formattedUsers = users.map(user => ({
      ...user,
      campaignsCount: user._count.campaigns
    }));
    
    const encryptedResponse = encryptData({
      users: formattedUsers,
      pagination: {
        total: totalUsers,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalUsers / parseInt(limit))
      }
    });
    
    return res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("Error fetching users:", error);
    const encryptedResponse = encryptData({ message: error.message });
    return res.status(500).json({ data: encryptedResponse });
  }
};

// Get specific user details including campaigns and transaction history
export const getUserDetails = async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    const encryptedResponse = encryptData({ message: "User ID is required." });
    return res.status(400).json({ data: encryptedResponse });
  }
  
  try {
    // Get user details
    const user = await prisma.users.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        is_verified: true,
        credits: true,
        last_login: true,
        created_at: true
      }
    });
    
    if (!user) {
      const encryptedResponse = encryptData({ message: "User not found." });
      return res.status(404).json({ data: encryptedResponse });
    }
    
    // Get user's campaigns
    const campaigns = await prisma.campaigns.findMany({
      where: { user_id: parseInt(userId) },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        created_at: true,
        is_built: true,
        _count: {
          select: { campaign_images: true }
        }
      }
    });
    
    // Get recent transactions
    const transactions = await prisma.credit_transactions.findMany({
      where: { user_id: parseInt(userId) },
      orderBy: { created_at: 'desc' },
      take: 10
    });
    
    const encryptedResponse = encryptData({
      user,
      campaigns: campaigns.map(c => ({
        ...c,
        images_count: c._count.campaign_images
      })),
      transactions
    });
    
    return res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("Error fetching user details:", error);
    const encryptedResponse = encryptData({ message: error.message });
    return res.status(500).json({ data: encryptedResponse });
  }
};

// Update user details (as admin)
export const updateUser = async (req, res) => {
  const { userId, username, email, role, isVerified, credits } = req.body;
  
  if (!userId) {
    const encryptedResponse = encryptData({ message: "User ID is required." });
    return res.status(400).json({ data: encryptedResponse });
  }
  
  try {
    // Check if user exists
    const userExists = await prisma.users.findUnique({
      where: { id: parseInt(userId) }
    });
    
    if (!userExists) {
      const encryptedResponse = encryptData({ message: "User not found." });
      return res.status(404).json({ data: encryptedResponse });
    }
    
    // Prepare update data
    const updateData = {};
    
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (isVerified !== undefined) updateData.is_verified = isVerified;
    
    // If credits are modified, create a transaction record
    let creditTransaction = null;
    if (credits !== undefined && credits !== userExists.credits) {
      const creditDifference = credits - userExists.credits;
      updateData.credits = credits;
      
      // Create transaction record for the adjustment
      creditTransaction = await prisma.credit_transactions.create({
        data: {
          user_id: parseInt(userId),
          amount: creditDifference,
          description: `Admin credit adjustment (${creditDifference > 0 ? 'added' : 'deducted'})`,
          transaction_type: 'admin_adjustment',
          admin_id: req.user.id // Admin who made the change
        }
      });
    }
    
    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: parseInt(userId) },
      data: {
        ...updateData,
        updated_at: new Date()
      }
    });
    
    const encryptedResponse = encryptData({
      message: "User updated successfully",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        is_verified: updatedUser.is_verified,
        credits: updatedUser.credits
      },
      creditTransaction
    });
    
    return res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("Error updating user:", error);
    const encryptedResponse = encryptData({ message: error.message });
    return res.status(500).json({ data: encryptedResponse });
  }
};

// Delete user (as admin)
export const deleteUserByAdmin = async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    const encryptedResponse = encryptData({ message: "User ID is required." });
    return res.status(400).json({ data: encryptedResponse });
  }
  
  try {
    // Check if trying to delete self
    if (parseInt(userId) === req.user.id) {
      const encryptedResponse = encryptData({ message: "Cannot delete your own admin account." });
      return res.status(400).json({ data: encryptedResponse });
    }
    
    // Get all campaigns to delete images
    const campaigns = await prisma.campaigns.findMany({
      where: { user_id: parseInt(userId) },
      include: {
        campaign_images: true
      }
    });
    
    // Delete image files
    for (const campaign of campaigns) {
      // Delete campaign cover image
      deleteImage(campaign.image_url);
      
      // Delete all campaign images
      for (const image of campaign.campaign_images) {
        deleteImage(image.url);
      }
    }
    
    // Delete user and all related data in a transaction
    await prisma.$transaction([
      // Delete refresh tokens
      prisma.refresh_tokens.deleteMany({
        where: { user_id: parseInt(userId) }
      }),
      
      // Delete credit transactions
      prisma.credit_transactions.deleteMany({
        where: { user_id: parseInt(userId) }
      }),
      
      // Delete campaign images
      prisma.campaign_images.deleteMany({
        where: {
          campaign: {
            user_id: parseInt(userId)
          }
        }
      }),
      
      // Delete campaigns
      prisma.campaigns.deleteMany({
        where: { user_id: parseInt(userId) }
      }),
      
      // Finally delete the user
      prisma.users.delete({
        where: { id: parseInt(userId) }
      })
    ]);
    
    const encryptedResponse = encryptData({ message: "User deleted successfully." });
    return res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("Error deleting user:", error);
    const encryptedResponse = encryptData({ message: error.message });
    return res.status(500).json({ data: encryptedResponse });
  }
};

// Get pending campaign reviews
export const getPendingCampaigns = async (req, res) => {
  const { page = 1, limit = 10 } = req.body;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  try {
    // Get total count of pending campaigns
    const totalPending = await prisma.campaigns.count({
      where: { status: 'PENDING' }
    });
    
    // Get pending campaigns
    const pendingCampaigns = await prisma.campaigns.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        _count: {
          select: { campaign_images: true }
        }
      },
      orderBy: { created_at: 'asc' }, // Oldest first for FIFO review
      skip,
      take: parseInt(limit)
    });
    
    // Format response
    const formattedCampaigns = pendingCampaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      image_url: campaign.image_url,
      created_at: campaign.created_at,
      user: campaign.user,
      images_count: campaign._count.campaign_images
    }));
    
    const encryptedResponse = encryptData({
      campaigns: formattedCampaigns,
      pagination: {
        total: totalPending,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalPending / parseInt(limit))
      }
    });
    
    return res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("Error fetching pending campaigns:", error);
    const encryptedResponse = encryptData({ message: error.message });
    return res.status(500).json({ data: encryptedResponse });
  }
};

// Review campaign (approve or reject)
export const reviewCampaign = async (req, res) => {
  const { campaignId, decision, adminNotes } = req.body;
  
  if (!campaignId || !decision) {
    const encryptedResponse = encryptData({ message: "Campaign ID and decision are required." });
    return res.status(400).json({ data: encryptedResponse });
  }
  
  if (decision !== 'APPROVED' && decision !== 'REJECTED') {
    const encryptedResponse = encryptData({ message: "Decision must be either 'APPROVED' or 'REJECTED'." });
    return res.status(400).json({ data: encryptedResponse });
  }
  
  try {
    // Check if campaign exists and is pending
    const campaign = await prisma.campaigns.findUnique({
      where: { id: parseInt(campaignId) },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
    
    if (!campaign) {
      const encryptedResponse = encryptData({ message: "Campaign not found." });
      return res.status(404).json({ data: encryptedResponse });
    }
    
    if (campaign.status !== 'PENDING') {
      const encryptedResponse = encryptData({ message: "Campaign has already been reviewed." });
      return res.status(400).json({ data: encryptedResponse });
    }
    
    // Update campaign status
    const updatedCampaign = await prisma.campaigns.update({
      where: { id: parseInt(campaignId) },
      data: {
        status: decision,
        admin_notes: adminNotes || null,
        admin_id: req.user.id,
        updated_at: new Date()
      }
    });
    
    const encryptedResponse = encryptData({
      message: `Campaign ${decision === 'APPROVED' ? 'approved' : 'rejected'} successfully.`,
      campaign: {
        id: updatedCampaign.id,
        name: updatedCampaign.name,
        status: updatedCampaign.status,
        admin_notes: updatedCampaign.admin_notes
      },
      user: campaign.user
    });
    
    return res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("Error reviewing campaign:", error);
    const encryptedResponse = encryptData({ message: error.message });
    return res.status(500).json({ data: encryptedResponse });
  }
};

// Get admin dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await prisma.users.count();
    const newUsersToday = await prisma.users.count({
      where: {
        created_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });
    
    // Get campaign statistics
    const totalCampaigns = await prisma.campaigns.count();
    const pendingCampaigns = await prisma.campaigns.count({
      where: { status: 'PENDING' }
    });
    const approvedCampaigns = await prisma.campaigns.count({
      where: { status: 'APPROVED' }
    });
    const rejectedCampaigns = await prisma.campaigns.count({
      where: { status: 'REJECTED' }
    });
    const activeCampaigns = await prisma.campaigns.count({
      where: { 
        status: 'APPROVED',
        is_built: true
      }
    });
    
    // Get credit statistics
    const totalCreditsIssued = await prisma.credit_transactions.aggregate({
      _sum: {
        amount: true
      },
      where: {
        amount: {
          gt: 0
        }
      }
    });
    
    const totalCreditsUsed = await prisma.credit_transactions.aggregate({
      _sum: {
        amount: true
      },
      where: {
        amount: {
          lt: 0
        }
      }
    });
    
    // Get recent campaign activity
    const recentCampaigns = await prisma.campaigns.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            username: true
          }
        }
      }
    });
    
    const encryptedResponse = encryptData({
      userStats: {
        total: totalUsers,
        newToday: newUsersToday
      },
      campaignStats: {
        total: totalCampaigns,
        pending: pendingCampaigns,
        approved: approvedCampaigns,
        rejected: rejectedCampaigns,
        active: activeCampaigns
      },
      creditStats: {
        totalIssued: totalCreditsIssued._sum.amount || 0,
        totalUsed: Math.abs(totalCreditsUsed._sum.amount || 0),
        currentBalance: (totalCreditsIssued._sum.amount || 0) + (totalCreditsUsed._sum.amount || 0)
      },
      recentActivity: recentCampaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        username: campaign.user.username,
        created_at: campaign.created_at
      }))
    });
    
    return res.status(200).json({ data: encryptedResponse });
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    const encryptedResponse = encryptData({ message: error.message });
    return res.status(500).json({ data: encryptedResponse });
  }
};