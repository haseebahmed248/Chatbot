import encryptData from "../utils/encryptData.js";
import deleteImage from "../utils/deleteImage.js";
import prisma from "../prisma/client.js";
import pythonApiMiddleware from "../utils/pythonApiMiddleware.js";
import path from 'path';
import fs from 'fs'

// Helper function to ensure selected_models is stored as a valid JSON string
const formatSelectedModels = (selectedModels) => {
  try {
    // If selectedModels is already a string, check if it's valid JSON
    if (typeof selectedModels === 'string') {
      JSON.parse(selectedModels); // This will throw if not valid JSON
      return selectedModels;
    }
    
    // If it's an array, convert to JSON string
    if (Array.isArray(selectedModels)) {
      return JSON.stringify(selectedModels);
    }
    
    // If it's null or undefined, return empty array as JSON
    return '[]';
  } catch (error) {
    console.error("Error formatting selected models:", error);
    return '[]'; // Default to empty array on error
  }
};


export const getCampaigns = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    const encryptedResponse = encryptData({ message: "User Id is required." });
    return res.status(400).json({ data: encryptedResponse });
  }

  try {
    // Updated to include status field
    const campaigns = await prisma.campaigns.findMany({
      where: {
        user_id: parseInt(userId)
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    const encryptedResponse = encryptData(campaigns);
    return res.status(200).json({ data: encryptedResponse });
  
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    
    const encryptedResponse = encryptData({ message: error.message });
    return res.status(500).json({ data: encryptedResponse });
  }
};

export const getCampaignDetails = async (req, res) => {
  const { campaignId, userId } = req.body;

  if (!campaignId || !userId) {
    const encryptedResponse = encryptData({ message: "Campaign ID and User ID are required." });
    return res.status(400).json({ data: encryptedResponse });
  }

  try {
    // Get campaign details - updated to include admin notes
    const campaign = await prisma.campaigns.findFirst({
      where: {
        id: parseInt(campaignId),
        user_id: parseInt(userId)
      }
    });
    
    if (!campaign) {
      const encryptedResponse = encryptData({ message: "Campaign not found." });
      return res.status(404).json({ data: encryptedResponse });
    }

    // Get campaign images
    const images = await prisma.campaign_images.findMany({
      where: {
        campaign_id: parseInt(campaignId)
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Add admin username if there's an admin_id
    let adminInfo = null;
    if (campaign.admin_id) {
      const admin = await prisma.users.findUnique({
        where: { id: campaign.admin_id },
        select: { username: true }
      });
      
      if (admin) {
        adminInfo = { username: admin.username };
      }
    }

    const responseData = {
      campaign,
      images,
      adminInfo
    };
    
    const encryptedResponse = encryptData(responseData);
    return res.status(200).json({ data: encryptedResponse });
  
  } catch (error) {
    console.error("Error fetching campaign details:", error);
    
    const encryptedResponse = encryptData({ message: error.message });
    return res.status(500).json({ data: encryptedResponse });
  }
};

export const addCampaign = async (req, res) => {
  const { name, description, modelName, selectedModels, userId } = req.body;
  const image = req.file;

  if (!name || !description || !userId || !image) {
    const encryptedResponse = encryptData({ message: "Name, description, user ID, and image are required." });
    return res.status(400).json({ data: encryptedResponse });
  }

  // Ensure we have at least one model selected
  const hasSelectedModels = selectedModels && Array.isArray(selectedModels) && selectedModels.length > 0;
  const hasModelName = modelName && typeof modelName === 'string';

  if (!hasSelectedModels && !hasModelName) {
    const encryptedResponse = encryptData({ message: "At least one model must be selected." });
    return res.status(400).json({ data: encryptedResponse });
  }

  try {
    // Check if user is verified
    const user = await prisma.users.findUnique({
      where: { id: parseInt(userId) },
      select: { is_verified: true }
    });
    
    if (!user || !user.is_verified) {
      const encryptedResponse = encryptData({ message: "Your account must be verified to create campaigns." });
      return res.status(403).json({ data: encryptedResponse });
    }
    
    const imageUrl = `${process.env.BACKEND_URL}/data/Pictures/${image.filename}`;
    
    // Format selected models as JSON string
    const formattedSelectedModels = formatSelectedModels(selectedModels);
    
    // Use the first selected model as the primary model if modelName is not provided
    let primaryModel = modelName;
    if (!primaryModel && hasSelectedModels) {
      const parsedModels = JSON.parse(formattedSelectedModels);
      primaryModel = parsedModels[0] || 'General';
    }
    
    // Updated to set status to PENDING
    const campaign = await prisma.campaigns.create({
      data: {
        name,
        description,
        model_name: primaryModel || 'General',
        selected_models: formattedSelectedModels,
        user_id: parseInt(userId),
        image_url: imageUrl,
        status: 'PENDING',
        is_built: false
      }
    });
    
    const encryptedResponse = encryptData({ 
      ...campaign,
      created_at: campaign.created_at.toISOString(),
      message: "Campaign created and submitted for approval. You will be notified once it's reviewed."
    });
    res.status(200).json({ data: encryptedResponse });

  } catch (error) {
    console.error("Error adding campaign:", error);
    
    const encryptedResponse = encryptData({ message: error.message });
    res.status(500).json({ data: encryptedResponse });
  }
};

export const addCampaignImage = async (req, res) => {
  const { campaignId, title, description } = req.body;
  const image = req.file;

  if (!campaignId || !image) {
    const encryptedResponse = encryptData({ message: "Campaign ID and image are required." });
    return res.status(400).json({ data: encryptedResponse });
  }

  try {
    // Check if campaign exists and is not built
    const campaign = await prisma.campaigns.findUnique({
      where: {
        id: parseInt(campaignId)
      },
      select: {
        id: true,
        is_built: true
      }
    });
    
    if (!campaign) {
      const encryptedResponse = encryptData({ message: "Campaign not found." });
      return res.status(404).json({ data: encryptedResponse });
    }
    
    if (campaign.is_built) {
      const encryptedResponse = encryptData({ message: "Cannot add images to a built campaign." });
      return res.status(400).json({ data: encryptedResponse });
    }
    
    const imageUrl = `${process.env.BACKEND_URL}/data/Pictures/${image.filename}`;
    
    const newImage = await prisma.campaign_images.create({
      data: {
        campaign_id: parseInt(campaignId),
        url: imageUrl,
        title: title || 'Untitled',
        description: description || ''
      }
    });

    const encryptedResponse = encryptData(newImage);
    res.status(200).json({ data: encryptedResponse });

  } catch (error) {
    console.error("Error adding campaign image:", error);
    
    const encryptedResponse = encryptData({ message: error.message });
    res.status(500).json({ data: encryptedResponse });
  }
};

export const updateCampaignImage = async (req, res) => {
  const { campaignId, imageId, title, description } = req.body;

  if (!campaignId || !imageId || !title) {
    const encryptedResponse = encryptData({ message: "Campaign ID, image ID, and title are required." });
    return res.status(400).json({ data: encryptedResponse });
  }

  try {
    // Check if campaign is built
    const campaign = await prisma.campaigns.findUnique({
      where: {
        id: parseInt(campaignId)
      },
      select: {
        is_built: true
      }
    });
    
    if (!campaign) {
      const encryptedResponse = encryptData({ message: "Campaign not found." });
      return res.status(404).json({ data: encryptedResponse });
    }
    
    if (campaign.is_built) {
      const encryptedResponse = encryptData({ message: "Cannot update images in a built campaign." });
      return res.status(400).json({ data: encryptedResponse });
    }
    
    // Check if image exists and belongs to the campaign
    const imageExists = await prisma.campaignImages.findFirst({
      where: {
        id: parseInt(imageId),
        campaign_id: parseInt(campaignId)
      }
    });
    
    if (!imageExists) {
      const encryptedResponse = encryptData({ message: "Image not found or doesn't belong to the campaign." });
      return res.status(404).json({ data: encryptedResponse });
    }
    
    const updatedImage = await prisma.campaignImages.update({
      where: {
        id: parseInt(imageId)
      },
      data: {
        title,
        description: description || '',
        updated_at: new Date()
      }
    });

    const encryptedResponse = encryptData(updatedImage);
    res.status(200).json({ data: encryptedResponse });

  } catch (error) {
    console.error("Error updating campaign image:", error);
    
    const encryptedResponse = encryptData({ message: error.message });
    res.status(500).json({ data: encryptedResponse });
  }
};

export const deleteCampaignImage = async (req, res) => {
  const { campaignId, imageId } = req.body;

  if (!campaignId || !imageId) {
    const encryptedResponse = encryptData({ message: "Campaign ID and image ID are required." });
    return res.status(400).json({ data: encryptedResponse });
  }

  try {
    // Check if campaign is built
    const campaign = await prisma.campaigns.findUnique({
      where: {
        id: parseInt(campaignId)
      },
      select: {
        is_built: true
      }
    });
    
    if (!campaign) {
      const encryptedResponse = encryptData({ message: "Campaign not found." });
      return res.status(404).json({ data: encryptedResponse });
    }
    
    if (campaign.is_built) {
      const encryptedResponse = encryptData({ message: "Cannot delete images from a built campaign." });
      return res.status(400).json({ data: encryptedResponse });
    }
    
    // First get the image URL to delete the file
    const image = await prisma.campaignImages.findFirst({
      where: {
        id: parseInt(imageId),
        campaign_id: parseInt(campaignId)
      },
      select: {
        url: true
      }
    });
    
    if (!image) {
      const encryptedResponse = encryptData({ message: "Image not found or doesn't belong to the campaign." });
      return res.status(404).json({ data: encryptedResponse });
    }
    
    // Delete the physical image file
    deleteImage(image.url);
    
    // Delete the image record from database
    await prisma.campaignImages.delete({
      where: {
        id: parseInt(imageId)
      }
    });
    
    const encryptedResponse = encryptData({ message: `Image ${imageId} deleted successfully.` });
    res.status(200).json({ data: encryptedResponse });

  } catch (error) {
    console.error("Error deleting campaign image:", error);
    
    const encryptedResponse = encryptData({ message: error.message });
    res.status(500).json({ data: encryptedResponse });
  }
};

export const deleteCampaign = async (req, res) => {
  const { campaignId, imageUrl } = req.body;

  if (!campaignId || !imageUrl) {
    const encryptedResponse = encryptData({ message: "All fields are required." });
    return res.status(400).json({ data: encryptedResponse });
  }

  try {
    // Check if campaign is already built
    const campaign = await prisma.campaigns.findUnique({
      where: {
        id: parseInt(campaignId)
      },
      select: {
        is_built: true
      }
    });
    
    if (!campaign) {
      const encryptedResponse = encryptData({ message: "Campaign not found." });
      return res.status(404).json({ data: encryptedResponse });
    }
    
    if (campaign.is_built) {
      const encryptedResponse = encryptData({ message: "Cannot delete a built campaign." });
      return res.status(400).json({ data: encryptedResponse });
    }

    // First, get all campaign images to delete them
    const images = await prisma.campaignImages.findMany({
      where: {
        campaign_id: parseInt(campaignId)
      },
      select: {
        url: true
      }
    });
    
    // Delete all image files associated with the campaign
    for (const image of images) {
      deleteImage(image.url);
    }
    
    // Delete all image records and the campaign in a transaction
    await prisma.$transaction([
      prisma.campaignImages.deleteMany({
        where: {
          campaign_id: parseInt(campaignId)
        }
      }),
      prisma.campaigns.delete({
        where: {
          id: parseInt(campaignId)
        }
      })
    ]);
    
    // Delete the campaign cover image
    deleteImage(imageUrl);
    
    const encryptedResponse = encryptData({ message: `Campaign ${campaignId} deleted successfully.` });
    res.status(200).json({ data: encryptedResponse });

  } catch (error) {
    console.error("Error deleting campaign:", error);
    
    const encryptedResponse = encryptData({ message: error.message });
    res.status(500).json({ data: encryptedResponse });
  }
};

export const updateCampaign = async (req, res) => {
  const { id, name, description, model_name, selectedModels } = req.body;
  const newImage = req.file;

  if (!id || !name || !description) {
    const encryptedResponse = encryptData({ message: "ID, Name, and Description are required." });
    return res.status(400).json({ data: encryptedResponse });
  }

  try {
    // Fetch the current campaign to check for existing image and status
    const existingCampaign = await prisma.campaigns.findUnique({
      where: {
        id: parseInt(id)
      },
      select: {
        image_url: true,
        is_built: true,
        status: true
      }
    });

    if (!existingCampaign) {
      const encryptedResponse = encryptData({ message: "Campaign not found." });
      return res.status(404).json({ data: encryptedResponse });
    }

    // Check if campaign is already built
    if (existingCampaign.is_built) {
      const encryptedResponse = encryptData({ message: "Cannot update a built campaign." });
      return res.status(400).json({ data: encryptedResponse });
    }
    
    // Check if campaign is already approved - updates should reset to pending
    const needsReapproval = existingCampaign.status === 'APPROVED' || existingCampaign.status === 'REJECTED';

    let imageUrl = existingCampaign.image_url;

    // If a new image is uploaded, update the image and delete the old one
    if (newImage) {
      deleteImage(imageUrl); // Delete the old image
      imageUrl = `${process.env.BACKEND_URL}/data/Pictures/${newImage.filename}`;
    }

    // Ensure we have at least one model selected
    const hasSelectedModels = selectedModels && Array.isArray(selectedModels) && selectedModels.length > 0;
    const hasModelName = model_name && typeof model_name === 'string';

    if (!hasSelectedModels && !hasModelName) {
      const encryptedResponse = encryptData({ message: "At least one model must be selected." });
      return res.status(400).json({ data: encryptedResponse });
    }

    // Format selected models as JSON string
    const formattedSelectedModels = formatSelectedModels(selectedModels);
    
    // Use the first selected model as the primary model if model_name is not provided
    let primaryModel = model_name;
    if (!primaryModel && hasSelectedModels) {
      const parsedModels = JSON.parse(formattedSelectedModels);
      primaryModel = parsedModels[0] || 'General';
    }

    // Update campaign, reset status to PENDING if it was previously approved/rejected
    const updatedCampaign = await prisma.campaigns.update({
      where: {
        id: parseInt(id)
      },
      data: {
        name,
        description,
        model_name: primaryModel || 'General',
        selected_models: formattedSelectedModels,
        image_url: imageUrl,
        status: needsReapproval ? 'PENDING' : existingCampaign.status,
        admin_notes: needsReapproval ? null : undefined, // Clear admin notes if resubmitting
        updated_at: new Date()
      }
    });
    
    const message = needsReapproval 
      ? "Campaign updated and resubmitted for approval." 
      : "Campaign updated successfully.";
    
    const encryptedResponse = encryptData({ 
      ...updatedCampaign,
      message
    });
    res.status(200).json({ data: encryptedResponse });

  } catch (error) {
    console.error("Error updating campaign:", error);
    
    const encryptedResponse = encryptData({ message: error.message });
    res.status(500).json({ data: encryptedResponse });
  }
};


export const buildCampaign = async (req, res) => {
  const { campaignId, userId } = req.body;

  if (!campaignId || !userId) {
    const encryptedResponse = encryptData({ message: "Campaign ID and User ID are required." });
    return res.status(400).json({ data: encryptedResponse });
  }

  try {
    // Check if campaign exists and belongs to user
    const campaign = await prisma.campaigns.findFirst({
      where: {
        id: parseInt(campaignId),
        user_id: parseInt(userId)
      }
    });
    
    if (!campaign) {
      const encryptedResponse = encryptData({ message: "Campaign not found or doesn't belong to user." });
      return res.status(404).json({ data: encryptedResponse });
    }
    
    // Check if campaign is already built
    if (campaign.is_built) {
      const encryptedResponse = encryptData({ message: "Campaign is already built." });
      return res.status(400).json({ data: encryptedResponse });
    }
    
    // Check if campaign is approved
    if (campaign.status !== 'APPROVED') {
      const encryptedResponse = encryptData({ 
        message: campaign.status === 'PENDING' 
          ? "Campaign is still pending approval." 
          : "Campaign has been rejected and cannot be built."
      });
      return res.status(400).json({ data: encryptedResponse });
    }

    // Get all campaign images
    const images = await prisma.campaign_images.findMany({
      where: {
        campaign_id: parseInt(campaignId)
      }
    });
    console.log('Campaign images:', images);
    
    // Check if campaign has both product and person images
    const productImages = images.filter(img => 
      img.title.toLowerCase().includes('product')
    );
    console.log('product images:', productImages);
    
    const personImages = images.filter(img => 
      img.title.toLowerCase().includes('person')
    );
    console.log('Person Images: ', personImages);
    
    if (productImages.length === 0 || personImages.length === 0) {
      const encryptedResponse = encryptData({ 
        message: "Campaign must have at least one product image and one person image to be built." 
      });
      return res.status(400).json({ data: encryptedResponse });
    }

    // Extract file paths from image URLs
    const imagePaths = images.map(img => {
      const filename = path.basename(img.url);
      return `${process.env.IMAGE_STORAGE_PATH || './data/Pictures'}/${filename}`;
    });

    // Verify all image files exist
    const missingImages = imagePaths.filter(path => !fs.existsSync(path));
    if (missingImages.length > 0) {
      console.error("Missing image files:", missingImages);
      const encryptedResponse = encryptData({ 
        message: "Some image files are missing. Please contact support." 
      });
      return res.status(500).json({ data: encryptedResponse });
    }

    // Send all images to Python backend in a single call
    try {
      // Create an array with all image paths, types, and descriptions
      const allImagesWithMetadata = images.map(img => {
        const filename = path.basename(img.url);
        const filePath = `${process.env.IMAGE_STORAGE_PATH || './data/Pictures'}/${filename}`;
        const type = img.title.toLowerCase().includes('product') ? 'product' : 'person';
        
        return {
          path: filePath,
          type: type,
          description: img.description || '',
          title: img.title || ''
        };
      });

      // Get all image paths in a flat array
      const allImagePaths = allImagesWithMetadata.map(img => img.path);
      
      // Make a single call with all images
      await pythonApiMiddleware.sendImagesToBackend(
        campaignId.toString(),
        campaign.name,
        allImagePaths,
        // Pass the metadata about image types
        allImagesWithMetadata.map(img => img.type),
        // Pass the descriptions
        allImagesWithMetadata.map(img => img.description),
        // Pass the titles
        allImagesWithMetadata.map(img => img.title)
      );
      
      // Notify Python to build the campaign with all images
      await pythonApiMiddleware.notifyBuildCampaign(campaignId.toString());
      
    } catch (pythonError) {
      console.error("Error communicating with Python backend:", pythonError);
      const encryptedResponse = encryptData({ 
        message: "Error communicating with image processing service. Please try again later." 
      });
      return res.status(500).json({ data: encryptedResponse });
    }
    
    // Update campaign to mark as built and set status to ACTIVE
    // const updatedCampaign = await prisma.campaigns.update({
    //   where: {
    //     id: parseInt(campaignId)
    //   },
    //   data: {
    //     is_built: true,
    //     build_date: new Date(),
    //     status: 'ACTIVE'
    //   }
    // });

    const encryptedResponse = encryptData({
      // ...updatedCampaign,
      message: "Campaign built successfully!"
    });
    res.status(200).json({ data: encryptedResponse });

  } catch (error) {
    console.error("Error building campaign:", error);
    
    const encryptedResponse = encryptData({ message: error.message });
    res.status(500).json({ data: encryptedResponse });
  }
};



//--------------------------PythonModelFunctions---------------------------------------
export const getResponse = async (req, res) => {
  try {
    // Validate the request body
    const { campain_id, campain_name, image_count_per_prompt, images } = req.body;
    
    if (!campain_id || !campain_name || !images || !Array.isArray(images)) {
      return res.status(400).json({ message: "Invalid request format" });
    }
    
    // Update the campaign in the database
    const updatedCampaign = await prisma.campaigns.update({
      where: {
        id: campain_id
      },
      data: {
        name: campain_name,
        image_count_per_prompt,
        images: JSON.stringify(images)
      }
    });
    
    return res.status(200).json({
      success: true,
      data: req.body
    });
    
  } catch (error) {
    console.error("Error updating campaign:", error);
    return res.status(500).json({ message: error.message || "An error occurred" });
  }
}



export const updateCampaignStatus = async (req, res) => {
  try {
    // Extract data from request body
    const { 
      campain_id, 
      campain_name, 
      model_name,
      status
    } = req.body;

    // Validate required fields
    if (!campain_id) {
      return res.status(400).json({ message: "Campaign ID is required" });
    }

    // Ensure status is 'ready' to mark as built
    if (status !== 'ready') {
      return res.status(400).json({ message: "Invalid status. Status must be 'ready' to mark campaign as built" });
    }

    // Update campaign in database
    const updatedCampaign = await prisma.campaigns.update({
      where: {
        id: parseInt(campain_id) // Convert to integer as id is Int in schema
      },
      data: {
        name: campain_name, // Update name if provided
        model_name: model_name, // Update model_name if provided
        status: 'ACTIVE', // Set status to ACTIVE based on CampaignStatus enum
        is_built: true, // Mark as built
        build_date: new Date() // Set build date to current timestamp
      }
    });

    // Return success response with updated campaign
    return res.status(200).json({ 
      success: true, 
      message: "Campaign status updated successfully",
      data: updatedCampaign
    });
  } catch (error) {
    console.error("Error updating campaign status:", error);
    return res.status(500).json({ message: error.message || "An error occurred while updating campaign status" });
  }
};