import { updateUsername, deleteUser, getUsername } from "../controllers/userController.js";

export default (req, res, endpoint) => {
  if (endpoint === "getUsername") return getUsername(req, res);
  if (endpoint === "updateUsername") return updateUsername(req, res);
  if (endpoint === "deleteUser") return deleteUser(req, res);

  return res.status(404).json({ message: "Invalid user API" });
};
