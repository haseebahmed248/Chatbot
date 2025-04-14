// services/imageUploadService.ts

import axios from 'axios';

// Interface for campaign image
interface CampaignImage {
  file: File;
  title: string;
  description: string;
  type: 'product' | 'person';
}

// Interface for API responses
interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
}

class ImageUploadService {
  private nodeBaseUrl: string;

  constructor() {
    // Base URL from environment variable
    this.nodeBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/';
  }

  /**
   * Upload a single image to the Node.js backend
   * @param campaignId The ID of the campaign
   * @param file The image file to upload
   * @param title The title of the image
   * @param description The description of the image
   * @returns API response
   */
  async uploadCampaignImage(
    campaignId: string,
    file: File,
    title: string,
    description: string
  ): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('campaignId', campaignId);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('image', file);
      
      const response = await axios.post(
        `${this.nodeBaseUrl}/campaigns/add-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Assuming the Node.js API returns data.data due to the encryption wrapper
      return {
        success: true,
        data: response.data.data,
        message: 'Image uploaded successfully!'
      };
    } catch (error: any) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        message: error.response?.data?.data?.message || error.message || 'Failed to upload image'
      };
    }
  }

  /**
   * Upload multiple images to a campaign
   * @param campaignId The ID of the campaign
   * @param images Array of campaign images to upload
   * @returns API response
   */
  async uploadCampaignImages(
    campaignId: string,
    images: CampaignImage[]
  ): Promise<ApiResponse> {
    try {
      const results = [];
      
      // Process each image sequentially
      for (const image of images) {
        const response = await this.uploadCampaignImage(
          campaignId,
          image.file,
          `${image.type}: ${image.title}`,
          image.description
        );
        
        if (!response.success) {
          throw new Error(response.message);
        }
        
        results.push(response.data);
      }
      
      return {
        success: true,
        data: results,
        message: `${images.length} images uploaded successfully!`
      };
    } catch (error: any) {
      console.error('Error uploading images:', error);
      return {
        success: false,
        message: error.message || 'Failed to upload images'
      };
    }
  }
  
  /**
   * Build a campaign - sends request to Node.js backend
   * @param campaignId The ID of the campaign
   * @param userId The ID of the user
   */
  async buildCampaign(campaignId: string, userId: string): Promise<ApiResponse> {
    try {
      // Call the Node.js backend to build the campaign
      // The Node.js backend will handle sending images to Python
      const response = await axios.post(
        `${this.nodeBaseUrl}/campaigns/build`,
        { campaignId, userId }
      );
      
      return {
        success: true,
        data: response.data.data,
        message: 'Campaign built successfully!'
      };
    } catch (error: any) {
      console.error('Error building campaign:', error);
      
      return {
        success: false,
        message: error.response?.data?.data?.message || error.message || 'Failed to build campaign'
      };
    }
  }
}

export default new ImageUploadService();