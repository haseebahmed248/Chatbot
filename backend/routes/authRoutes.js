// routes/authRoutes.js
import {
  register,
  login,
  getUser,
  refreshToken,
  logout
} from "../controllers/authController.js";

const authRoutes = (req, res, endpoint) => {
  switch (endpoint) {
    case "register":
      return register(req, res);

    case "login":
      return login(req, res);

    case "getUser":
      return getUser(req, res);
      
    case "refreshToken":
      return refreshToken(req, res);
      
    case "logout":
      return logout(req, res);

    default:
      return res.status(404).json({ message: "Endpoint not found" });
  }
};

export default authRoutes;