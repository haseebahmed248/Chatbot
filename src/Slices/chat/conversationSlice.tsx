// src/redux/slices/conversationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Define types for our state
interface UploadedImage {
  file: File;
  preview: string;
}

interface ConversationMessage {
  type: 'user' | 'bot';
  content: string;
  image?: string | null;
  images?: Array<{url: string}>;
  timestamp: string;
  prompt?: string;
}

interface PromptParams {
  prompt: string;
  image?: File | null;
}

interface ConversationState {
  conversations: ConversationMessage[];
  isLoading: boolean;
  error: string | null;
  uploadedImage: UploadedImage | null;
  currentPrompt?: string;
}

interface ApiResponse {
  text?: string;
  images?: Array<{url: string}>;
}

// Define the initial state
const initialState: ConversationState = {
  conversations: [],
  isLoading: false,
  error: null,
  uploadedImage: null
};

// Async thunk for sending prompts to the backend
export const sendPrompt = createAsyncThunk<ApiResponse, PromptParams, { rejectValue: string }>(
  'conversation/sendPrompt',
  async (params, thunkAPI) => {
    try {
      const formData = new FormData();
      formData.append('prompt', params.prompt);
      if (params.image) {
        formData.append('image', params.image);
      }

      const response = await fetch('YOUR_BACKEND_API_ENDPOINT', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Server responded with an error');
      }

      return await response.json() as ApiResponse;
    } catch (error) {
      return thunkAPI.rejectWithValue((error as Error).message);
    }
  }
);

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    setUploadedImage: (state, action: PayloadAction<UploadedImage>) => {
      state.uploadedImage = action.payload;
    },
    clearUploadedImage: (state) => {
      state.uploadedImage = null;
    },
    clearConversations: (state) => {
      state.conversations = [];
    },
    setCurrentPrompt: (state, action: PayloadAction<string>) => {
      state.currentPrompt = action.payload;
    }
    // You might add more actions like editMessage, deleteMessage, etc.
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendPrompt.pending, (state, action) => {
        state.isLoading = true;
        // Store the current prompt for reference
        state.currentPrompt = action.meta.arg.prompt;
        // Add user message to conversation immediately
        state.conversations.push({
          type: 'user',
          content: action.meta.arg.prompt,
          image: state.uploadedImage ? state.uploadedImage.preview : null,
          timestamp: new Date().toISOString(),
        });
      })
      .addCase(sendPrompt.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add bot response
        state.conversations.push({
          type: 'bot',
          content: action.payload.text || "No response from server",
          images: action.payload.images || [],
          timestamp: new Date().toISOString(),
          prompt: state.currentPrompt
        });
        // Clear uploaded image and current prompt after successful submission
        state.uploadedImage = null;
        state.currentPrompt = undefined;
      })
      .addCase(sendPrompt.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Unknown error occurred";
        // Add error message to conversation
        state.conversations.push({
          type: 'bot',
          content: "Sorry, there was an error processing your request.",
          timestamp: new Date().toISOString(),
        });
        // Clear current prompt
        state.currentPrompt = undefined;
      });
  },
});

export const { 
  setUploadedImage, 
  clearUploadedImage, 
  clearConversations,
  setCurrentPrompt
} = conversationSlice.actions;

export default conversationSlice.reducer;