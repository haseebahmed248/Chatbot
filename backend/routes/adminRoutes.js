import { 
    getAllUsers, 
    getUserDetails, 
    updateUser,
    deleteUserByAdmin,
    getPendingCampaigns, 
    reviewCampaign,
    getDashboardStats
  } from "../controllers/adminController.js";
  
  import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
  
  // Admin route handler
  const adminRoutes = async (req, res, endpoint) => {
    // Apply authentication middleware
    try {
      await new Promise((resolve, reject) => {
        verifyToken(req, res, (err) => {
          if (err) return reject(err);
          
          // Check admin role
          isAdmin(req, res, (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });
    } catch (error) {
      // If middleware failed, the response has already been sent
      return;
    }
    
    // Route to the appropriate endpoint
    switch (endpoint) {
      case "get-all-users":
        return getAllUsers(req, res);
        
      case "get-user-details":
        return getUserDetails(req, res);
        
      case "update-user":
        return updateUser(req, res);
        
      case "delete-user":
        return deleteUserByAdmin(req, res);
        
      case "get-pending-campaigns":
        return getPendingCampaigns(req, res);
        
      case "review-campaign":
        return reviewCampaign(req, res);
        
      case "get-dashboard-stats":
        return getDashboardStats(req, res);
        
      default:
        return res.status(404).json({ 
          data: encryptData({ message: "Admin endpoint not found" }) 
        });
    }
  };
  
  export default adminRoutes;