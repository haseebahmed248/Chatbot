// src/utils/authMiddleware.ts
import { Middleware } from '@reduxjs/toolkit';
import { 
  checkAuthStatus, 
  refreshToken, 
  startTokenRefresh 
} from '../Slices/AuthSlice';

// Use a simpler type definition that works with TypeScript
const authMiddleware: Middleware = store => next => (action:any) => {
  // Process the action first
  const result = next(action);
  
  // Check auth status after any action is dispatched 
  // (but not for the checkAuthStatus action itself to avoid infinite loops)
  if (action.type !== checkAuthStatus.type) {
    store.dispatch(checkAuthStatus());
  }
  
  // Get current state after the action
  const state = store.getState();
  const { auth } = state;
  
  // Check if we need to refresh the token
  const now = Date.now();
  
  // If user is authenticated and the access token will expire soon (within 5 minutes)
  if (
    auth.isAuthenticated && 
    auth.accessTokenExpiry && 
    now > (auth.accessTokenExpiry - 5 * 60 * 1000) && 
    auth.refreshToken &&
    auth.refreshTokenExpiry &&
    now < auth.refreshTokenExpiry &&
    !auth.tokenRefreshInProgress
  ) {
    // Start the token refresh process
    store.dispatch(startTokenRefresh());
    
    // Use @ts-ignore for the thunk action
    // @ts-ignore - TypeScript doesn't understand thunk actions
    store.dispatch(refreshToken());
  }
  
  return result;
};

export default authMiddleware;