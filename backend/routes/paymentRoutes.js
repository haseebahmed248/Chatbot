import { createCheckoutSession, handleWebhook, verifySession } from "../controllers/paymentController.js";

export default (req, res, endpoint) => {
  if (endpoint === "createCheckoutSession") return createCheckoutSession(req, res);
    if (endpoint === "verifySession") return verifySession(req, res);
    if (endpoint === "webhook") return handleWebhook(req, res);

  return res.status(404).json({ message: "Invalid payment API" });
};
