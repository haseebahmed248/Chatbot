import { configureStore, combineReducers } from '@reduxjs/toolkit';
import themeReducer from '../theme/reducer';
import conversationReducer from '../chat/conversationSlice';
import authReducer from '../AuthSlice'; 
import campaignsReducer from '../CampaignsSlice';
import creditReducer from '../CreditSlice';
import authMiddleware from '../../utils/authMiddleware';

const rootReducer = combineReducers({
  theme: themeReducer,
  conversation: conversationReducer,
  auth: authReducer,
  campaigns: campaignsReducer,
  credits: creditReducer, // Add the credit reducer
});

// Define RootState
export type RootState = ReturnType<typeof rootReducer>;

// Configure the Redux store
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types that might contain non-serializable data
        ignoredActions: [
          'campaigns/addCampaign/pending', 
          'campaigns/updateCampaign/pending',
          // Add auth-related actions that might have Date objects
          'auth/refreshToken/fulfilled',
          'auth/loginUser/fulfilled',
          'auth/registerUser/fulfilled',
          // Add credit-related actions
          'credits/fetchCredits/pending',
          'credits/fetchTransactionHistory/pending',
          'credits/addCredits/pending',
          'credits/useCredits/pending'
        ],
        // Ignore these paths in the payload
        ignoredActionPaths: [
          'meta.arg', 
          'payload.image', 
          'payload.accessTokenExpiry', 
          'payload.refreshTokenExpiry'
        ],
        // Ignore these paths in the state
        ignoredPaths: [
          'campaigns.currentCampaign.image',
          'auth.accessTokenExpiry',
          'auth.refreshTokenExpiry'
        ],
      },
    }).concat(authMiddleware), // Add the authMiddleware here
});

// Set up auto-checking of auth status every minute
setInterval(() => {
  store.dispatch({ type: 'auth/checkAuthStatus' });
}, 60000);

// Define and export AppDispatch
export type AppDispatch = typeof store.dispatch;

export default store;