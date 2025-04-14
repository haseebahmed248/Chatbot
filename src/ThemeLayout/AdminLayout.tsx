// src/Pages/Admin/AdminLayout.tsx
import React, { ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "Slices/theme/store";
import { logout } from "Slices/AuthSlice";

// Import logo/assets
import logo01 from "assets/images/logo/logo-01.png";

// Import admin styles
import '../assets/scss/admin/admin.scss';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Check if the current path matches a link
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-layout">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-brand">
          <Link to="/admin/dashboard" className="admin-logo-link">
            <img src={logo01} alt="Admin Dashboard" />
            <span className="admin-brand-name">INTELLECTAI</span>
            <span className="admin-page-name">Admin Dashboard</span>
          </Link>
        </div>
        
        <div className="admin-user-section">
          <div className="admin-welcome">
            Welcome, <span>{user?.username}</span>
          </div>
          <button className="admin-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="admin-main-wrapper">
        {/* Admin Sidebar */}
        <aside className="admin-sidebar">
          <nav className="admin-nav">
            <div className="admin-nav-item">
              <Link 
                to="/admin/dashboard"
                className={`admin-nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
              >
                <i className="fa fa-tachometer" aria-hidden="true"></i>
                Dashboard
              </Link>
            </div>
            <div className="admin-nav-item">
              <Link 
                to="/admin/users"
                className={`admin-nav-link ${isActive('/admin/users') ? 'active' : ''}`}
              >
                <i className="fa fa-users" aria-hidden="true"></i>
                User Management
              </Link>
            </div>
            <div className="admin-nav-item">
              <Link 
                to="/admin/campaigns"
                className={`admin-nav-link ${isActive('/admin/campaigns') ? 'active' : ''}`}
              >
                <i className="fa fa-list" aria-hidden="true"></i>
                Campaign Reviews
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;