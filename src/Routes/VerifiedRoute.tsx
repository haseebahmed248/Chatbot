import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'Slices/theme/store';
import { UserRole } from 'Slices/AuthSlice';
import { Alert } from 'react-bootstrap';

interface VerifiedRouteProps {
  children: React.ReactNode;
}

/**
 * VerifiedRoute component to protect routes that require a verified user account
 * For admin users, redirects to admin dashboard instead
 */
const VerifiedRoute: React.FC<VerifiedRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page with the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin users should go to admin dashboard instead of user verified routes
  if (user?.role === UserRole.ADMIN) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Regular users must be verified
  if (!user?.is_verified) {
    return (
      <div className="container mt-5">
        <Alert variant="warning">
          <Alert.Heading>Account Verification Required</Alert.Heading>
          <p>
            Your account is pending verification by an administrator. 
            You will have access to this feature once your account is verified.
          </p>
          <div className="mt-3">
            <button 
              className="btn btn-primary"
              onClick={() => window.location.href = '/'}
            >
              Return to Dashboard
            </button>
          </div>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};

export default VerifiedRoute;