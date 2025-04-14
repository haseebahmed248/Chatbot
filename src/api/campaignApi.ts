// api/campaignApi.ts

import imageUploadService from '../services/imageUploadService';

interface UploadImageParams {
  campaignId: string;
  userId: string;
  files: File[];
  titles: Record<string, string>;
  descriptions: Record<string, string>;
  imageTypes: Record<string, 'product' | 'person'>;
}

interface BuildCampaignParams {
  campaignId: string;
  userId: string;
}

export const campaignApi = {
  /**
   * Upload multiple images to a campaign
   */
  uploadImages: async ({
    campaignId,
    userId,
    files,
    titles,
    descriptions,
    imageTypes
  }: UploadImageParams) => {
    // Format the images for the upload service
    const images = files.map((file, index) => {
      const fileId = `file-${index}`;
      return {
        file,
        title: titles[fileId] || file.name.split('.')[0],
        description: descriptions[fileId] || '',
        type: imageTypes[fileId] || 'product'
      };
    });

    // Call the upload service
    return await imageUploadService.uploadCampaignImages(campaignId, images);
  },

  /**
   * Build a campaign
   */
  buildCampaign: async ({ campaignId, userId }: BuildCampaignParams) => {
    return await imageUploadService.buildCampaign(campaignId, userId);
  }
};