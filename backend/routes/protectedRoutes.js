import { authenticateToken } from "../middleware/authMiddleware.js";

export default (req, res, endpoint) => {
  if (endpoint === "dashboard") return authenticateToken(req, res);

  return res.status(404).json({ message: "Invalid user API" });
};
