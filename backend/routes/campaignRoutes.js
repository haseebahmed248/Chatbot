import { 
  addCampaign, 
  deleteCampaign, 
  getCampaigns, 
  updateCampaign,
  getCampaignDetails,
  addCampaignImage,
  deleteCampaignImage,
  updateCampaignImage,
  buildCampaign,
  getResponse,
  updateCampaignStatus
} from "../controllers/campaignController.js";

export default (req, res, endpoint) => {
  if (endpoint === "getCampaigns") return getCampaigns(req, res);
  if (endpoint === "getCampaignDetails") return getCampaignDetails(req, res);
  if (endpoint === "addCampaign") return addCampaign(req, res);
  if (endpoint === "updateCampaign") return updateCampaign(req, res);
  if (endpoint === "deleteCampaign") return deleteCampaign(req, res);
  if (endpoint === "addCampaignImage") return addCampaignImage(req, res);
  if (endpoint === "deleteCampaignImage") return deleteCampaignImage(req, res);
  if (endpoint === "updateCampaignImage") return updateCampaignImage(req, res);
  if (endpoint === "buildCampaign") return buildCampaign(req, res);
  if (endpoint === "verifyCampaign") {
    return getResponse(req, res);
  }
  if (endpoint === "updateCampaignStatus") return updateCampaignStatus(req, res);

  return res.status(404).json({ message: "Invalid campaign API" });
};