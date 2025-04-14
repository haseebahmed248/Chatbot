import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { RouteProps, nonAuthRoutes, routes, verifiedRoutes, adminRoutes } from "./routes";
import ThemeLayout from "../ThemeLayout";
import NonLayout from "ThemeLayout/NonLayout";
import AdminLayout from "ThemeLayout/AdminLayout"; // Import the new AdminLayout
import { useSelector } from "react-redux";
import { RootState } from "Slices/theme/store";
import { UserRole } from "Slices/AuthSlice";

// Import Route Guards
import PrivateRoute from "./PrivateRoute";
import AdminRoute from "./AdminRoute";
import VerifiedRoute from "./VerifiedRoute";

const Routing = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Non-authenticated routes (login, register, etc.) */}
          {(nonAuthRoutes || []).map((item: RouteProps, key: number) => (
            <Route key={key} path={item.path} element={
              <NonLayout>
                {item.component}
              </NonLayout>
            } />
          ))}

          {/* Regular authenticated routes for normal users */}
          {(routes || []).map((item: RouteProps, key: number) => (
            <Route key={key} path={item.path} element={
              <PrivateRoute>
                <ThemeLayout>
                  {item.component}
                </ThemeLayout>
              </PrivateRoute>
            } />
          ))}
          
          {/* Routes that require verified accounts */}
          {(verifiedRoutes || []).map((item: RouteProps, key: number) => (
            <Route key={key} path={item.path} element={
              <VerifiedRoute>
                <ThemeLayout>
                  {item.component}
                </ThemeLayout>
              </VerifiedRoute>
            } />
          ))}
          
          {/* Admin-only routes with AdminLayout */}
          {(adminRoutes || []).map((item: RouteProps, key: number) => (
            <Route key={key} path={item.path} element={
              <AdminRoute>
                <AdminLayout>
                  {item.component}
                </AdminLayout>
              </AdminRoute>
            } />
          ))}
          
          {/* Catch-all route - role-based redirect */}
          <Route path="*" element={
            isAuthenticated 
              ? user?.role === UserRole.ADMIN 
                ? <Navigate to="/admin/dashboard" replace /> 
                : <Navigate to="/" replace />
              : <Navigate to="/login" replace />
          } />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default Routing;