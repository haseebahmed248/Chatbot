// src/Slices/CreditSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import encryptData from 'utils/encryptData';
import decryptData from 'utils/decryptData';
import { updateUserCredits } from './AuthSlice';

interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  description: string;
  created_at: string;
  payment_id?: string;
  transaction_type: string;
}

interface CreditState {
  creditBalance: number;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  transactions: Transaction[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  checkoutSessionId: string | null; // Added for Stripe checkout
  isAutoFulfilled: boolean; // Added for free plans
}

// Define types for Stripe payment integration
interface PlanParams {
  userId: number | string;
  plan: string;
  price: number;
}

interface CreateCheckoutResponse {
  id: string;
  autoFulfilled?: boolean;
  message?: string;
}

interface VerifySessionParams {
  sessionId: string;
}

interface VerifySessionResponse {
  valid: boolean;
  message: string;
  newBalance?: number;
  plan?: string;
}

const initialState: CreditState = {
  creditBalance: 0,
  isLoading: false,
  error: null,
  successMessage: null,
  transactions: [],
  pagination: {
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false
  },
  checkoutSessionId: null,
  isAutoFulfilled: false
};

// Fetch user's credit balance
export const fetchCredits = createAsyncThunk<{ credits: number }, void, { rejectValue: string }>(
  'credits/fetchCredits',
  async (_, thunkAPI) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const userId = localStorage.getItem("userId");
      console.log('userid: ',userId)
      
      if (!userId) {
        return thunkAPI.rejectWithValue('User ID not found');
      }
      
      const encryptedPayload = encryptData({
        module: "credits",
        endpoint: "getUserCredits",
        data: { userId }
      });
      
      const response = await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      const data = decryptData(response.data.data);
      console.log('credits data: ', data);
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        try {
          const errorData = error.response.data.data;
          if (errorData) {
            const decryptedError = decryptData(errorData);
            return thunkAPI.rejectWithValue(decryptedError.message || 'Failed to fetch credits');
          }
        } catch (decryptError) {
          // If decryption fails, use the raw error message
        }
        
        return thunkAPI.rejectWithValue(
          error.response.data?.message || 'Failed to fetch credits'
        );
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch credits';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Fetch credit transaction history
export const fetchTransactionHistory = createAsyncThunk<
  { transactions: Transaction[], pagination: any },
  { limit?: number, offset?: number },
  { rejectValue: string }
>(
  'credits/fetchTransactionHistory',
  async ({ limit = 10, offset = 0 }, thunkAPI) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        return thunkAPI.rejectWithValue('User ID not found');
      }
      
      const encryptedPayload = encryptData({
        module: "credits",
        endpoint: "getCreditHistory",
        data: { userId, limit, offset }
      });
      
      const response = await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      const data = decryptData(response.data.data);
      
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        try {
          const errorData = error.response.data.data;
          if (errorData) {
            const decryptedError = decryptData(errorData);
            return thunkAPI.rejectWithValue(decryptedError.message || 'Failed to fetch transaction history');
          }
        } catch (decryptError) {
          // If decryption fails, use the raw error message
        }
        
        return thunkAPI.rejectWithValue(
          error.response.data?.message || 'Failed to fetch transaction history'
        );
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch transaction history';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Add credits (simulated payment)
export const addCredits = createAsyncThunk<
  { newBalance: number, transaction: Transaction },
  { amount: number, paymentMethod: string },
  { rejectValue: string }
>(
  'credits/addCredits',
  async ({ amount, paymentMethod }, thunkAPI) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        return thunkAPI.rejectWithValue('User ID not found');
      }
      
      const encryptedPayload = encryptData({
        module: "credits",
        endpoint: "addCredits",
        data: { userId, amount, paymentMethod }
      });
      
      const response = await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      const data = decryptData(response.data.data);
      
      // Update the user's credit balance in the auth state
      thunkAPI.dispatch(updateUserCredits(data.newBalance));
      
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        try {
          const errorData = error.response.data.data;
          if (errorData) {
            const decryptedError = decryptData(errorData);
            return thunkAPI.rejectWithValue(decryptedError.message || 'Failed to add credits');
          }
        } catch (decryptError) {
          // If decryption fails, use the raw error message
        }
        
        return thunkAPI.rejectWithValue(
          error.response.data?.message || 'Failed to add credits'
        );
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to add credits';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Use credits (deduct from balance)
export const useCredits = createAsyncThunk<
  { newBalance: number, transaction: Transaction },
  { amount: number, reason: string },
  { rejectValue: string }
>(
  'credits/useCredits',
  async ({ amount, reason }, thunkAPI) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        return thunkAPI.rejectWithValue('User ID not found');
      }
      
      const encryptedPayload = encryptData({
        module: "credits",
        endpoint: "useCredits",
        data: { userId, amount, reason }
      });
      
      const response = await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      const data = decryptData(response.data.data);
      
      // Update the user's credit balance in the auth state
      thunkAPI.dispatch(updateUserCredits(data.newBalance));
      
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        try {
          const errorData = error.response.data.data;
          if (errorData) {
            const decryptedError = decryptData(errorData);
            return thunkAPI.rejectWithValue(decryptedError.message || 'Failed to use credits');
          }
        } catch (decryptError) {
          // If decryption fails, use the raw error message
        }
        
        return thunkAPI.rejectWithValue(
          error.response.data?.message || 'Failed to use credits'
        );
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to use credits';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Create Stripe checkout session
export const createCheckoutSession = createAsyncThunk<CreateCheckoutResponse, PlanParams, { rejectValue: string }>(
  'credits/createCheckoutSession',
  async (params, thunkAPI) => {
    try {
      console.log(`Creating checkout session for plan: ${params.plan}, price: ${params.price}`);
      const apiUrl = process.env.REACT_APP_API_URL;
      
      // Create encrypted payload
      const encryptedPayload = encryptData({
        module: "payment",
        endpoint: "createCheckoutSession",
        data: {
          userId: params.userId,
          plan: params.plan,
          price: params.price
        }
      });
      
      // Send request to backend
      const response = await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      
      // Decrypt the response
      const data = decryptData(response.data.data);
      console.log('Checkout session created:', data);
      
      // Check if session was auto-fulfilled (for free plans or development mode)
      if (data.autoFulfilled) {
        console.log('Session was auto-fulfilled:', data.message || 'Free plan activated');
        
        // Fetch updated credit balance if auto-fulfilled
        thunkAPI.dispatch(fetchCredits());
        
        return {
          id: data.id,
          autoFulfilled: true,
          message: data.message || 'Plan activated successfully'
        };
      }
      
      return {
        id: data.id,
        autoFulfilled: false
      };
    } catch (error: unknown) {
      console.error('Error creating checkout session:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        try {
          const errorData = error.response.data.data;
          if (errorData) {
            const decryptedError = decryptData(errorData);
            return thunkAPI.rejectWithValue(decryptedError.message || 'Failed to create checkout session');
          }
        } catch (decryptError) {
          // If decryption fails, use the raw error message
          console.error('Error decrypting error response:', decryptError);
        }
        
        return thunkAPI.rejectWithValue(
          error.response.data?.message || 'Failed to create checkout session'
        );
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Verify Stripe checkout session
export const verifyCheckoutSession = createAsyncThunk<VerifySessionResponse, VerifySessionParams, { rejectValue: string }>(
  'credits/verifyCheckoutSession',
  async (params, thunkAPI) => {
    try {
      console.log(`Verifying checkout session: ${params.sessionId}`);
      const apiUrl = process.env.REACT_APP_API_URL;
      
      // Skip verification for dev sessions
      if (params.sessionId.startsWith('dev_')) {
        console.log('Development session detected - skipping verification');
        return {
          valid: true,
          message: 'Development mode - payment verification skipped',
          newBalance: 0 // This will be updated in the subsequent fetchCredits call
        };
      }
      
      // Create encrypted payload
      const encryptedPayload = encryptData({
        module: "payment",
        endpoint: "verifySession",
        data: { sessionId: params.sessionId }
      });
      
      // Send request to backend
      const response = await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      
      // Decrypt the response
      const data = decryptData(response.data.data);
      console.log('Session verification result:', data);
      
      // Update user credits in auth slice if verification was successful
      if (data.valid && data.newBalance !== undefined) {
        thunkAPI.dispatch(updateUserCredits(data.newBalance));
      }
      
      return data;
    } catch (error: unknown) {
      console.error('Error verifying checkout session:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        try {
          const errorData = error.response.data.data;
          if (errorData) {
            const decryptedError = decryptData(errorData);
            return thunkAPI.rejectWithValue(decryptedError.message || 'Failed to verify session');
          }
        } catch (decryptError) {
          // If decryption fails, use the raw error message
          console.error('Error decrypting error response:', decryptError);
        }
        
        return thunkAPI.rejectWithValue(
          error.response.data?.message || 'Failed to verify session'
        );
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify session';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

const creditSlice = createSlice({
  name: 'credits',
  initialState,
  reducers: {
    clearCreditErrors: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    setCredits: (state, action: PayloadAction<number>) => {
      state.creditBalance = action.payload;
    },
    clearCheckoutSession: (state) => {
      state.checkoutSessionId = null;
      state.isAutoFulfilled = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch credits
      .addCase(fetchCredits.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCredits.fulfilled, (state, action) => {
        state.isLoading = false;
        state.creditBalance = action.payload.credits;
      })
      .addCase(fetchCredits.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch credits';
      })
      
      // Fetch transaction history
      .addCase(fetchTransactionHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactionHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload.transactions;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTransactionHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch transaction history';
      })
      
      // Add credits
      .addCase(addCredits.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addCredits.fulfilled, (state, action) => {
        state.isLoading = false;
        state.creditBalance = action.payload.newBalance;
        // Add the new transaction to the beginning of the list
        state.transactions = [action.payload.transaction, ...state.transactions];
        // Update total in pagination
        state.pagination.total += 1;
      })
      .addCase(addCredits.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to add credits';
      })
      
      // Use credits
      .addCase(useCredits.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(useCredits.fulfilled, (state, action) => {
        state.isLoading = false;
        state.creditBalance = action.payload.newBalance;
        // Add the new transaction to the beginning of the list
        state.transactions = [action.payload.transaction, ...state.transactions];
        // Update total in pagination
        state.pagination.total += 1;
      })
      .addCase(useCredits.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to use credits';
      })
      
      // Create checkout session
      .addCase(createCheckoutSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.checkoutSessionId = null;
        state.isAutoFulfilled = false;
      })
      .addCase(createCheckoutSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.checkoutSessionId = action.payload.id;
        state.isAutoFulfilled = action.payload.autoFulfilled || false;
        
        // For auto-fulfilled plans, set success message
        if (action.payload.autoFulfilled) {
          state.successMessage = action.payload.message || 'Plan activated successfully';
        }
      })
      .addCase(createCheckoutSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to create checkout session';
        state.checkoutSessionId = null;
        state.isAutoFulfilled = false;
      })
      
      // Verify checkout session
      .addCase(verifyCheckoutSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(verifyCheckoutSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.checkoutSessionId = null;
        
        if (action.payload.valid) {
          state.successMessage = action.payload.message || 'Payment verified successfully!';
          // If new balance is provided, update the credits
          if (action.payload.newBalance !== undefined) {
            state.creditBalance = action.payload.newBalance;
          }
        } else {
          state.error = action.payload.message || 'Payment verification failed';
        }
      })
      .addCase(verifyCheckoutSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to verify payment';
      });
  },
});

export const { clearCreditErrors, clearSuccessMessage, setCredits, clearCheckoutSession } = creditSlice.actions;
export default creditSlice.reducer;