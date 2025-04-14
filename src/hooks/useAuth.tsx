// src/hooks/useAuth.ts
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../Slices/theme/store';
import { 
  checkAuthStatus, 
  refreshToken, 
  fetchUserData,
  logout 
} from '../Slices/AuthSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    accessToken,
    accessTokenExpiry,
    refreshTokenExpiry
  } = useSelector((state: RootState) => state.auth);

  // On initial load, check authentication status
  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  // If authenticated but no user data, fetch it
  useEffect(() => {
    if (isAuthenticated && accessToken && !user) {
      dispatch(fetchUserData());
    }
  }, [isAuthenticated, accessToken, user, dispatch]);

  // Check if token needs refresh (less than 5 minutes left)
  useEffect(() => {
    if (
      isAuthenticated &&
      accessTokenExpiry && 
      Date.now() > (accessTokenExpiry - 5 * 60 * 1000) &&
      refreshTokenExpiry &&
      Date.now() < refreshTokenExpiry
    ) {
      dispatch(refreshToken());
    }
  }, [isAuthenticated, accessTokenExpiry, refreshTokenExpiry, dispatch]);

  const logoutUser = () => {
    dispatch(logout());
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    logoutUser,
    // Add user's credits to the returned object for easy access
    credits: user?.credits || 0
  };
};

export default useAuth;