// routes/creditRoutes.js
import {
    getUserCredits,
    getCreditHistory,
    addCredits,
    useCredits
  } from "../controllers/creditController.js";
  
  const creditRoutes = (req, res, endpoint) => {
    switch (endpoint) {
      case "getUserCredits":
        return getUserCredits(req, res);
  
      case "getCreditHistory":
        return getCreditHistory(req, res);
  
      case "addCredits":
        return addCredits(req, res);
        
      case "useCredits":
        return useCredits(req, res);
  
      default:
        return res.status(404).json({ message: "Endpoint not found" });
    }
  };
  
  export default creditRoutes;