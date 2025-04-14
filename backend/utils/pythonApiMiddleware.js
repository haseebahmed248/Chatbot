import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * Middleware to communicate with the Python backend
 * with built-in error handling to prevent application crashes
 */
class PythonApiMiddleware {
  constructor() {
    this.baseUrl = process.env.PYTHON_API_URL || 'http://149.40.228.126:8000';
    this.timeout = parseInt(process.env.PYTHON_API_TIMEOUT || '15000', 10); // 5 second timeout default
    this.isBackendAvailable = null; // We don't know yet
    this.lastCheckTime = 0;
    this.checkInterval = 60000; // Don't check availability more than once per minute
  }

  /**
   * Check if the Python backend is available
   * @returns {Promise<boolean>} - True if backend is available, false otherwise
   */
  async checkBackendAvailability() {
    // Don't check too frequently
    const now = Date.now();
    if (now - this.lastCheckTime < this.checkInterval) {
      return this.isBackendAvailable;
    }
    
    this.lastCheckTime = now;
    
    try {
      // Simple HEAD request to check if the server is up
      await axios.head(`${this.baseUrl}/health-check`, { timeout: this.timeout });
      this.isBackendAvailable = true;
      return true;
    } catch (error) {
      console.warn(`Python backend is not available: ${error.message || 'Unknown error'}`);
      this.isBackendAvailable = false;
      return false;
    }
  }

  /**
   * Send images to the Python backend with graceful error handling
   * @param {string} campaignId - The ID of the campaign
   * @param {string} campaignName - The name of the campaign
   * @param {Array<string>} imagePaths - Array of paths to image files
   * @param {Array<string>} [imageTypes] - Optional array of image types (e.g., 'product', 'person')
   * @param {Array<string>} [imageDescriptions] - Optional array of image descriptions
   * @param {Array<string>} [imageTitles] - Optional array of image titles
   * @returns {Promise<object>} - The response from the Python backend or error info
   */
  async sendImagesToBackend(campaignId, campaignName, imagePaths, imageTypes = [], imageDescriptions = [], imageTitles = []) {
    try {
      // Optional quick check if backend is available before attempting long operation
      console.log('Data ', campaignId, campaignName, imagePaths);
      if (this.isBackendAvailable === false) {
        return {
          success: false,
          message: "Python backend is not available (cached status)",
          isMocked: true
        };
      }

      // Create JSON payload instead of FormData
      const payload = {
        campaignid: campaignId,
        campaign_name: campaignName,
        files: []
      };

      // Read each image file and convert to base64
      for (let i = 0; i < imagePaths.length; i++) {
        const imagePath = imagePaths[i];
        const filename = path.basename(imagePath);
        // Read file synchronously as Buffer
        const fileBuffer = fs.readFileSync(imagePath);
        // Convert to base64
        const base64Data = fileBuffer.toString('base64');
        
        // Determine content type based on extension
        const extension = path.extname(imagePath).toLowerCase();
        const contentType = 
          extension === '.png' ? 'image/png' : 
          extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : 
          'application/octet-stream';
          
        // Create file info object with description in text_content field
        const fileInfo = {
          filename: filename,
          content: base64Data,
          content_type: contentType,
          prompt: imageDescriptions && imageDescriptions[i] ? imageDescriptions[i] : ''
        };
        
        payload.files.push(fileInfo);
      }

      console.log('JSON payload created with', payload.files.length, 'files');
      console.log('payload', payload);
      // Send the request to the Python backend
      const response = await axios.post(
        `${this.baseUrl}/upload_files/`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: this.timeout
        }
      );

      return response.data;
    } catch (error) {
      // Log the error but don't crash
      console.error('Error sending images to Python backend:', error.message);
      
      // Update backend availability status
      this.isBackendAvailable = false;
      this.lastCheckTime = Date.now();

      // Return a graceful failure response
      return {
        success: false,
        message: "Failed to communicate with image processing service",
        error: error.message,
        isMocked: true
      };
    }
  }

  /**
   * Notify Python backend about campaign being built with graceful error handling
   * @param {string} campaignId - The ID of the campaign
   * @returns {Promise<object>} - The response from the Python backend or error info
   */
  async notifyBuildCampaign(campaignId) {
    try {
      // Optional quick check if backend is available before attempting
      if (this.isBackendAvailable === false) {
        return {
          success: false,
          message: "Python backend is not available (cached status)",
          isMocked: true
        };
      }

      const response = await axios.post(
        `${this.baseUrl}/receive-payload/`,
        {
          campaign_id: campaignId
        },
        {
          timeout: this.timeout
        }
      );

      return response.data;
    } catch (error) {
      // Log the error but don't crash
      console.error('Error notifying Python backend about build:', error.message);
      
      // Update backend availability status
      this.isBackendAvailable = false;
      this.lastCheckTime = Date.now();

      // Return a graceful failure response
      return {
        success: false, 
        message: "Failed to notify image processing service about the build",
        error: error.message,
        isMocked: true
      };
    }
  }
}

export default new PythonApiMiddleware();