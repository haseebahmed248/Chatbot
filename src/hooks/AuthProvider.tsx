import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'Slices/theme/store';
import { checkAuthStatus, refreshToken, fetchUserData } from 'Slices/AuthSlice';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  
  const { 
    isAuthenticated, 
    accessTokenExpiry, 
    tokenRefreshInProgress,
    user
  } = useSelector((state: RootState) => state.auth);

  // Check authentication status on mount
  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  // Fetch user data if authenticated but no user data
  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(fetchUserData());
    }
  }, [isAuthenticated, user, dispatch]);

  // Setup token refresh mechanism
  useEffect(() => {
    if (!isAuthenticated || !accessTokenExpiry || tokenRefreshInProgress) return;

    const now = Date.now();
    const timeUntilExpiry = accessTokenExpiry - now;
    
    // If token is close to expiry (less than 5 minutes), refresh it immediately
    if (timeUntilExpiry < 300000) {
      dispatch(refreshToken());
      return;
    }
    
    // Schedule refresh 5 minutes before expiry
    const refreshTime = timeUntilExpiry - 300000;
    const refreshTimer = setTimeout(() => {
      dispatch(refreshToken());
    }, refreshTime);
    
    return () => clearTimeout(refreshTimer);
  }, [isAuthenticated, accessTokenExpiry, tokenRefreshInProgress, dispatch]);

  return <>{children}</>;
};

export default AuthProvider;