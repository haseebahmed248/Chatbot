import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'Slices/theme/store';
import { UserRole } from 'Slices/AuthSlice';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * AdminRoute component to protect routes that require admin privileges
 */
const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page with the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== UserRole.ADMIN) {
    // Redirect to dashboard if authenticated but not an admin
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;