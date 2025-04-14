// src/Slices/AuthSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import encryptData from 'utils/encryptData';
import decryptData from 'utils/decryptData';

// User roles enum to match backend
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

interface User {
  id: string;
  username: string;
  email: string;
  credits: number;
  role: UserRole;
  is_verified: boolean;
  last_login?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiry: number | null;
  refreshTokenExpiry: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokenRefreshInProgress: boolean;
}

interface RegisterParams {
  username: string;
  email: string;
  password: string;
}

interface LoginParams {
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
  message?: string;
}

// Load initial state from localStorage if available
const loadState = (): Partial<AuthState> => {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const accessTokenExpiry = localStorage.getItem('accessTokenExpiry');
    const refreshTokenExpiry = localStorage.getItem('refreshTokenExpiry');
    const user = localStorage.getItem('user');
    
    if (accessToken && refreshToken && accessTokenExpiry && refreshTokenExpiry && user) {
      const now = Date.now();
      const parsedAccessExpiry = parseInt(accessTokenExpiry);
      const parsedRefreshExpiry = parseInt(refreshTokenExpiry);
      
      // Skip if refresh token is expired
      if (now >= parsedRefreshExpiry) {
        return {};
      }
      
      return {
        user: JSON.parse(user),
        accessToken,
        refreshToken,
        accessTokenExpiry: parsedAccessExpiry,
        refreshTokenExpiry: parsedRefreshExpiry,
        isAuthenticated: true
      };
    }
  } catch (error) {
    console.error('Error loading auth state from localStorage:', error);
  }
  
  return {};
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  accessTokenExpiry: null,
  refreshTokenExpiry: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  tokenRefreshInProgress: false,
  ...loadState()
};

// Async thunk for registering users
export const registerUser = createAsyncThunk<AuthResponse, RegisterParams, { rejectValue: string }>(
  'auth/register',
  async (params, thunkAPI) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      
      // Create the encrypted payload
      const encryptedPayload = encryptData({
        module: "auth",
        endpoint: "register",
        data: { formData: params }
      });
      
      // Send request to the backend
      const response = await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      
      // Decrypt the response
      const data = decryptData(response.data.data);
      
      // Store authentication data in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('accessTokenExpiry', data.accessTokenExpiry.toString());
      localStorage.setItem('refreshTokenExpiry', data.refreshTokenExpiry.toString());
      
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        // Try to decrypt the error message if possible
        try {
          const errorData = error.response.data.data;
          if (errorData) {
            const decryptedError = decryptData(errorData);
            return thunkAPI.rejectWithValue(decryptedError.message || 'Registration failed');
          }
        } catch {
          // Fall back to default error if decryption fails
          return thunkAPI.rejectWithValue(
            error.response.data?.message || 'Registration failed'
          );
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for logging in users
export const loginUser = createAsyncThunk<AuthResponse, LoginParams, { rejectValue: string }>(
  'auth/login',
  async (params, thunkAPI) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      
      // Create the encrypted payload
      const encryptedPayload = encryptData({
        module: "auth",
        endpoint: "login",
        data: { formData: params }
      });
      
      // Send request to the backend
      const response = await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      
      // Decrypt the response
      const data = decryptData(response.data.data);
      // Store authentication data in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userId',data.user.id)
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('accessTokenExpiry', data.accessTokenExpiry.toString());
      localStorage.setItem('refreshTokenExpiry', data.refreshTokenExpiry.toString());
      
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        // Try to decrypt the error message if possible
        try {
          const errorData = error.response.data.data;
          if (errorData) {
            const decryptedError = decryptData(errorData);
            return thunkAPI.rejectWithValue(decryptedError.message || 'Login failed');
          }
        } catch {
          // Fall back to default error if decryption fails
          return thunkAPI.rejectWithValue(
            error.response.data?.message || 'Login failed'
          );
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Other thunks (refreshToken, fetchUserData, logout) remain the same...

// Async thunk for refreshing the token
export const refreshToken = createAsyncThunk<AuthResponse, void, { rejectValue: string }>(
  'auth/refreshToken',
  async (_, thunkAPI) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const refresh = localStorage.getItem('refreshToken');
      
      if (!refresh) {
        return thunkAPI.rejectWithValue('No refresh token available');
      }
      
      // Create the encrypted payload
      const encryptedPayload = encryptData({
        module: "auth",
        endpoint: "refreshToken",
        data: { refreshToken: refresh }
      });
      
      // Send request to the backend
      const response = await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      
      // Decrypt the response
      const data = decryptData(response.data.data);
      
      // Update tokens in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('accessTokenExpiry', data.accessTokenExpiry.toString());
      localStorage.setItem('refreshTokenExpiry', data.refreshTokenExpiry.toString());
      
      return data;
    } catch (error: unknown) {
      // Handle token refresh failure by logging out
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('accessTokenExpiry');
      localStorage.removeItem('refreshTokenExpiry');
      
      if (axios.isAxiosError(error) && error.response) {
        try {
          const errorData = error.response.data.data;
          if (errorData) {
            const decryptedError = decryptData(errorData);
            return thunkAPI.rejectWithValue(decryptedError.message || 'Token refresh failed');
          }
        } catch {
          return thunkAPI.rejectWithValue(
            error.response.data?.message || 'Token refresh failed'
          );
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for fetching user data
export const fetchUserData = createAsyncThunk<User, void, { rejectValue: string }>(
  'auth/fetchUserData',
  async (_, thunkAPI) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        return thunkAPI.rejectWithValue('No auth token found');
      }
      
      // Create the encrypted payload
      const encryptedPayload = encryptData({
        module: "auth",
        endpoint: "getUser",
        data: { token }
      });
      
      // Send request to the backend
      const response = await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      
      // Decrypt the response
      const data = decryptData(response.data.data);
      
      // Update user data in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return data.user;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        try {
          const errorData = error.response.data.data;
          if (errorData) {
            const decryptedError = decryptData(errorData);
            return thunkAPI.rejectWithValue(decryptedError.message || 'Failed to fetch user data');
          }
        } catch {
          return thunkAPI.rejectWithValue(
            error.response.data?.message || 'Failed to fetch user data'
          );
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user data';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

// Async thunk for logging out
export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, thunkAPI) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        // Create the encrypted payload
        const encryptedPayload = encryptData({
          module: "auth",
          endpoint: "logout",
          data: { refreshToken }
        });
        
        // Send request to the backend (don't wait for response)
        axios.post(`${apiUrl}`, { payload: encryptedPayload })
          .catch(err => console.error('Error during logout:', err));
      }
      
      // Clean up localStorage regardless of server response
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('accessTokenExpiry');
      localStorage.removeItem('refreshTokenExpiry');
      
    } catch (error: unknown) {
      // Even if there's an error, we should still clean up local storage
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('accessTokenExpiry');
      localStorage.removeItem('refreshTokenExpiry');
      
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set a flag when token refresh starts to prevent multiple refresh attempts
    startTokenRefresh: (state) => {
      state.tokenRefreshInProgress = true;
    },
    
    // Check auth status - verify tokens, refresh if needed
    checkAuthStatus: (state) => {
      const now = Date.now();
      
      // Check if access token exists and is valid
      if (state.accessToken && state.accessTokenExpiry) {
        if (now >= state.accessTokenExpiry) {
          // Access token expired, check refresh token
          if (state.refreshToken && state.refreshTokenExpiry && now < state.refreshTokenExpiry) {
            // Don't set isAuthenticated to false here - let the refresh token process handle it
          } else {
            // No valid refresh token, clear auth state
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.accessTokenExpiry = null;
            state.refreshTokenExpiry = null;
            state.isAuthenticated = false;
            
            // Clear localStorage
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('accessTokenExpiry');
            localStorage.removeItem('refreshTokenExpiry');
          }
        } else {
          // Access token still valid
          state.isAuthenticated = true;
        }
      } else {
        // No access token, check for refresh token
        const storedRefreshToken = localStorage.getItem('refreshToken');
        const storedRefreshExpiry = localStorage.getItem('refreshTokenExpiry');
        
        if (storedRefreshToken && storedRefreshExpiry && now < parseInt(storedRefreshExpiry)) {
          // We have a valid refresh token but no access token - leave auth status as is
          // The token refresh thunk should be triggered elsewhere
        } else {
          // No valid tokens at all
          state.isAuthenticated = false;
        }
      }
    },
    
    // Update user credentials
    updateUserInfo: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload
        };
        // Update in localStorage as well
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    
    // Update user credits (after operations that change credit balance)
    updateUserCredits: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.credits = action.payload;
        // Update in localStorage as well
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
    
    // Clear any error message
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Register user cases
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.accessTokenExpiry = action.payload.accessTokenExpiry;
        state.refreshTokenExpiry = action.payload.refreshTokenExpiry;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Registration failed';
      })
      
      // Login user cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.accessTokenExpiry = action.payload.accessTokenExpiry;
        state.refreshTokenExpiry = action.payload.refreshTokenExpiry;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Login failed';
      })
      
      // Fetch user data cases
      .addCase(fetchUserData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchUserData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch user data';
        
        // If fetching user data fails and it's a token issue, clear auth state
        if (action.payload === 'Invalid or expired token') {
          state.isAuthenticated = false;
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
          state.accessTokenExpiry = null;
          state.refreshTokenExpiry = null;
        }
      })
      
      // Refresh token cases
      .addCase(refreshToken.pending, (state) => {
        state.tokenRefreshInProgress = true;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.accessTokenExpiry = action.payload.accessTokenExpiry;
        state.refreshTokenExpiry = action.payload.refreshTokenExpiry;
        state.tokenRefreshInProgress = false;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.error = action.payload || 'Token refresh failed';
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.accessTokenExpiry = null;
        state.refreshTokenExpiry = null;
        state.tokenRefreshInProgress = false;
        
        // Clear localStorage on refresh failure
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('accessTokenExpiry');
        localStorage.removeItem('refreshTokenExpiry');
      })
      
      // Logout cases
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.accessTokenExpiry = null;
        state.refreshTokenExpiry = null;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        // Even on error, clear the auth state
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.accessTokenExpiry = null;
        state.refreshTokenExpiry = null;
      });
  },
});

export const { 
  checkAuthStatus, 
  startTokenRefresh, 
  updateUserCredits,
  updateUserInfo,
  clearError 
} = authSlice.actions;

export default authSlice.reducer;