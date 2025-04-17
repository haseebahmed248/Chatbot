// src/Slices/CampaignsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import encryptData from '../utils/encryptData';
import decryptData from 'utils/decryptData';

// Define Campaign and CampaignImage interfaces
export interface Campaign {
  id: string | number;
  name: string;
  description: string;
  model?: string;
  model_name?: string; // For backend compatibility
  selectedModels?: string[]; // For multiple model selection
  image?: string | any; // Using 'any' to allow File objects
  image_url?: string; // For backend compatibility
  createdAt?: string;
  created_at?: string; // For backend compatibility
  status?: string;
  user_id?: number | string;
  userId?: number | string;
  is_built?: boolean;
  build_date?: string;
  is_model_campaign?: boolean;
  is_product_campaign?: boolean;
  campaignType?: string;
}

export interface CampaignImage {
  id: string;
  campaign_id: string | number;
  url: string;
  title: string;
  description: string;
  created_at: string;
}

// For strictly typed API requests
export interface AddCampaignRequest {
  name: string;
  description: string;
  modelName: string; // Keep for backward compatibility
  selectedModels?: string[]; // For multiple model selection
  image: File | null;
  campaignType?: string;
  is_model_campaign?: boolean;
  is_product_campaign?: boolean;
}

export interface UpdateCampaignRequest {
  campaignData: Campaign;
  image: File | null;
}

export interface DeleteCampaignRequest {
  campaignId: string | number;
  imageUrl: string;
}

export interface AddCampaignImageRequest {
  campaignId: string | number;
  image: File;
  title: string;
  description: string;
}

export interface DeleteCampaignImageRequest {
  campaignId: string | number;
  imageId: string;
}

// State interface
interface CampaignsState {
  campaigns: Campaign[];
  campaignImages: CampaignImage[];
  loading: boolean;
  error: string | null;
  currentCampaign: Campaign | null;
}

// Initial state
const initialState: CampaignsState = {
  campaigns: [],
  campaignImages: [],
  loading: false,
  error: null,
  currentCampaign: null
};

// API base URL
const apiUrl = process.env.REACT_APP_API_URL;

// Helper function to safely parse selected models
const parseSelectedModels = (json: string | null | undefined): string[] => {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Error parsing selected models:", e);
    return [];
  }
};

// Async thunks for API calls
export const fetchCampaigns = createAsyncThunk(
  `${process.env.REACT_APP_API_URL}campaigns/fetchCampaigns`,
  async (_, { rejectWithValue }) => {
    try {
      const userId = localStorage.getItem("userId");
      const encryptedPayload = encryptData({ 
        module: "campaigns", 
        endpoint: "getCampaigns", 
        data: { userId } 
      });
      
      const response = await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      
      // Decrypt the response data
      const decryptedData = decryptData(response.data.data);
      
      // Map over the decrypted data
      const campaigns = decryptedData.map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        model: campaign.model_name || '',
        model_name: campaign.model_name || '',
        selectedModels: parseSelectedModels(campaign.selected_models),
        image: campaign.image_url || '',
        image_url: campaign.image_url || '',
        createdAt: campaign.created_at || '',
        created_at: campaign.created_at || '',
        status: campaign.status || 'active',
        user_id: campaign.user_id || userId,
        userId: campaign.user_id || userId,
        is_built: campaign.is_built || false,
        build_date: campaign.build_date || null
      }));
      
      return campaigns;
    } catch (error: any) {
      console.error("Error fetching campaigns:", error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch campaigns');
    }
  }
);

// Fetch campaign details including images
export const fetchCampaignDetails = createAsyncThunk(
  'campaigns/fetchCampaignDetails',
  async (campaignId: string, { rejectWithValue }) => {
    try {
      const userId = localStorage.getItem("userId");
      const encryptedPayload = encryptData({ 
        module: "campaigns", 
        endpoint: "getCampaignDetails", 
        data: { campaignId, userId } 
      });
      
      const response = await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      
      // Decrypt the response data
      const decryptedData = decryptData(response.data.data);
      
      // Process campaign details
      const campaignDetails = {
        campaignInfo: {
          id: decryptedData.campaign.id,
          name: decryptedData.campaign.name,
          description: decryptedData.campaign.description,
          model: decryptedData.campaign.model_name || '',
          model_name: decryptedData.campaign.model_name || '',
          selectedModels: parseSelectedModels(decryptedData.campaign.selected_models),
          image: decryptedData.campaign.image_url || '',
          image_url: decryptedData.campaign.image_url || '',
          createdAt: decryptedData.campaign.created_at || '',
          created_at: decryptedData.campaign.created_at || '',
          status: decryptedData.campaign.status || 'active',
          user_id: decryptedData.campaign.user_id || userId,
          is_built: decryptedData.campaign.is_built || false,
          build_date: decryptedData.campaign.build_date || null
        },
        campaignImages: decryptedData.images || []
      };
      
      return campaignDetails;
    } catch (error: any) {
      console.error("Error fetching campaign details:", error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch campaign details');
    }
  }
);

export const addCampaign = createAsyncThunk(
  'campaigns/addCampaign',
  async (campaignData: AddCampaignRequest, { rejectWithValue }) => {
    try {
      const userId = localStorage.getItem("userId");
      
      // Validate having at least one model selected
      if ((!campaignData.modelName && (!campaignData.selectedModels || campaignData.selectedModels.length === 0))) {
        return rejectWithValue("At least one model must be selected.");
      }
      
      const formPayload = {
        name: campaignData.name,
        description: campaignData.description,
        modelName: campaignData.modelName,
        selectedModels: campaignData.selectedModels || [],
        userId: userId,
        image: campaignData.image
      };

      const encryptedPayload = encryptData({ 
        module: "campaigns", 
        endpoint: "addCampaign", 
        data: formPayload 
      });
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("payload", encryptedPayload);
      
      if (formPayload.image) {
        formData.append("image", formPayload.image);
      }
      
      const response = await axios.post(`${apiUrl}`, formData, { 
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      // Return campaign data with parsed selected models
      const responseData = response.data.data;
      return {
        ...responseData,
        selectedModels: parseSelectedModels(responseData.selected_models),
        is_built: false
      };
    } catch (error: any) {
      console.error("Error adding campaign:", error);
      return rejectWithValue(error.response?.data?.message || 'Failed to add campaign');
    }
  }
);

// Add campaign image
export const addCampaignImage = createAsyncThunk(
  'campaigns/addCampaignImage',
  async (request: AddCampaignImageRequest, { rejectWithValue }) => {
    try {
      const formPayload = {
        campaignId: request.campaignId,
        title: request.title,
        description: request.description
      };

      const encryptedPayload = encryptData({ 
        module: "campaigns", 
        endpoint: "addCampaignImage", 
        data: formPayload 
      });
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("payload", encryptedPayload);
      
      if (request.image) {
        formData.append("image", request.image);
      }
      
      const response = await axios.post(`${apiUrl}`, formData, { 
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      // Decrypt and return the new image data
      const decryptedData = decryptData(response.data.data);
      return decryptedData;
    } catch (error: any) {
      console.error("Error adding campaign image:", error);
      return rejectWithValue(error.response?.data?.message || 'Failed to add image');
    }
  }
);

export const updateCampaign = createAsyncThunk(
  'campaigns/updateCampaign',
  async (request: UpdateCampaignRequest, { rejectWithValue }) => {
    try {
      // Validate having at least one model selected
      if ((!request.campaignData.model && !request.campaignData.model_name && 
          (!request.campaignData.selectedModels || request.campaignData.selectedModels.length === 0))) {
        return rejectWithValue("At least one model must be selected.");
      }
      
      const editPayload = {
        id: request.campaignData.id,
        name: request.campaignData.name,
        description: request.campaignData.description,
        model_name: request.campaignData.model_name || request.campaignData.model,
        selectedModels: request.campaignData.selectedModels || [],
        image: request.image
      };

      const encryptedPayload = encryptData({ 
        module: "campaigns", 
        endpoint: "updateCampaign", 
        data: editPayload 
      });
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("payload", encryptedPayload);
      
      if (request.image) {
        formData.append("image", request.image);
      }
      
      const response = await axios.post(`${apiUrl}`, formData, { 
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      // Return updated campaign with parsed selected models
      const responseData = response.data.data;
      return { 
        ...request.campaignData,
        ...responseData,
        selectedModels: parseSelectedModels(responseData.selected_models)
      };
    } catch (error: any) {
      console.error("Error updating campaign:", error);
      return rejectWithValue(error.response?.data?.message || 'Failed to update campaign');
    }
  }
);

// Update campaign image details
export const updateCampaignImage = createAsyncThunk(
  'campaigns/updateCampaignImage',
  async (
    { 
      campaignId, 
      imageId, 
      title, 
      description 
    }: { 
      campaignId: string | number; 
      imageId: string; 
      title: string; 
      description: string 
    }, 
    { rejectWithValue }
  ) => {
    try {
      const encryptedPayload = encryptData({ 
        module: "campaigns", 
        endpoint: "updateCampaignImage", 
        data: { campaignId, imageId, title, description } 
      });
      
      const response = await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      
      // Return updated image data
      return {
        id: imageId,
        campaign_id: campaignId,
        title,
        description
      };
    } catch (error: any) {
      console.error("Error updating campaign image:", error);
      return rejectWithValue(error.response?.data?.message || 'Failed to update image');
    }
  }
);

export const deleteCampaign = createAsyncThunk(
  'campaigns/deleteCampaign',
  async (request: DeleteCampaignRequest, { rejectWithValue }) => {
    try {
      const encryptedPayload = encryptData({ 
        module: "campaigns", 
        endpoint: "deleteCampaign", 
        data: { campaignId: request.campaignId, imageUrl: request.imageUrl } 
      });
      
      await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      
      return request.campaignId;
    } catch (error: any) {
      console.error("Error deleting campaign:", error);
      return rejectWithValue(error.response?.data?.message || 'Failed to delete campaign');
    }
  }
);

// Delete campaign image
export const deleteCampaignImage = createAsyncThunk(
  'campaigns/deleteCampaignImage',
  async (request: DeleteCampaignImageRequest, { rejectWithValue }) => {
    try {
      const encryptedPayload = encryptData({ 
        module: "campaigns", 
        endpoint: "deleteCampaignImage", 
        data: { campaignId: request.campaignId, imageId: request.imageId } 
      });
      
      await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      
      return request.imageId;
    } catch (error: any) {
      console.error("Error deleting campaign image:", error);
      return rejectWithValue(error.response?.data?.message || 'Failed to delete image');
    }
  }
);

// Build campaign thunk
export const buildCampaign = createAsyncThunk(
  'campaigns/buildCampaign',
  async (campaignId: string | number, { rejectWithValue }) => {
    try {
      const userId = localStorage.getItem("userId");
      
      if (!userId) {
        return rejectWithValue("User not authenticated");
      }

      const encryptedPayload = encryptData({ 
        module: "campaigns", 
        endpoint: "buildCampaign", 
        data: { campaignId, userId } 
      });
      
      const response = await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      
      // Decrypt the response data
      const decryptedData = decryptData(response.data.data);
      
      return {
        ...decryptedData,
        id: decryptedData.id || campaignId,
        is_built: true
      };
    } catch (error: any) {
      console.error("Error building campaign:", error);
      return rejectWithValue(error.response?.data?.message || 'Failed to build campaign');
    }
  }
);

// Create the slice
const campaignsSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    setCurrentCampaign: (state, action: PayloadAction<Campaign | null>) => {
      state.currentCampaign = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Fetch campaigns
    builder.addCase(fetchCampaigns.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCampaigns.fulfilled, (state, action) => {
      state.loading = false;
      state.campaigns = action.payload;
    });
    builder.addCase(fetchCampaigns.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Fetch campaign details
    builder.addCase(fetchCampaignDetails.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCampaignDetails.fulfilled, (state, action) => {
      state.loading = false;
      state.currentCampaign = action.payload.campaignInfo;
      state.campaignImages = action.payload.campaignImages;
    });
    builder.addCase(fetchCampaignDetails.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Add campaign
    builder.addCase(addCampaign.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addCampaign.fulfilled, (state, action) => {
      state.loading = false;
      state.campaigns.unshift(action.payload);
    });
    builder.addCase(addCampaign.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Add campaign image
    builder.addCase(addCampaignImage.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addCampaignImage.fulfilled, (state, action) => {
      state.loading = false;
      state.campaignImages.unshift(action.payload);
    });
    builder.addCase(addCampaignImage.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Update campaign
    builder.addCase(updateCampaign.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateCampaign.fulfilled, (state, action) => {
      state.loading = false;
      state.campaigns = state.campaigns.map(campaign => 
        campaign.id === action.payload.id ? action.payload : campaign
      );
      if (state.currentCampaign && state.currentCampaign.id === action.payload.id) {
        state.currentCampaign = action.payload;
      }
    });
    builder.addCase(updateCampaign.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update campaign image
    builder.addCase(updateCampaignImage.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateCampaignImage.fulfilled, (state, action) => {
      state.loading = false;
      state.campaignImages = state.campaignImages.map(image => 
        image.id === action.payload.id 
          ? { ...image, ...action.payload }
          : image
      );
    });
    builder.addCase(updateCampaignImage.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Delete campaign
    builder.addCase(deleteCampaign.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteCampaign.fulfilled, (state, action) => {
      state.loading = false;
      state.campaigns = state.campaigns.filter(campaign => campaign.id !== action.payload);
    });
    builder.addCase(deleteCampaign.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete campaign image
    builder.addCase(deleteCampaignImage.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteCampaignImage.fulfilled, (state, action) => {
      state.loading = false;
      state.campaignImages = state.campaignImages.filter(image => image.id !== action.payload);
    });
    builder.addCase(deleteCampaignImage.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Build campaign
    builder.addCase(buildCampaign.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(buildCampaign.fulfilled, (state, action) => {
      state.loading = false;
      state.campaigns = state.campaigns.map(campaign => 
        campaign.id === action.payload.id 
          ? { ...campaign, is_built: true, build_date: action.payload.build_date } 
          : campaign
      );
      if (state.currentCampaign && state.currentCampaign.id === action.payload.id) {
        state.currentCampaign = { 
          ...state.currentCampaign, 
          is_built: true,
          build_date: action.payload.build_date
        };
      }
    });
    builder.addCase(buildCampaign.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  }
});

export const { setCurrentCampaign, clearError } = campaignsSlice.actions;
export default campaignsSlice.reducer;