import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'Slices/theme/store';
import { UserRole } from 'Slices/AuthSlice';

interface PrivateRouteProps {
  children: React.ReactNode;
}

/**
 * PrivateRoute component to protect routes that require authentication
 * Also redirects admin users to admin dashboard
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page with the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is an admin, redirect to admin dashboard instead of user routes
  if (user?.role === UserRole.ADMIN) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;