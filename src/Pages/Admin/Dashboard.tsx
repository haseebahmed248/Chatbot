// src/Pages/Admin/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import encryptData from 'utils/encryptData';
import decryptData from 'utils/decryptData';
// Import admin styles
import '../../assets/scss/admin/admin.scss';

interface DashboardStats {
  userStats: {
    total: number;
    newToday: number;
  };
  campaignStats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    active: number;
  };
  creditStats: {
    totalIssued: number;
    totalUsed: number;
    currentBalance: number;
  };
  recentActivity: {
    id: number;
    name: string;
    status: string;
    username: string;
    created_at: string;
  }[];
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.REACT_APP_API_URL;
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          setError('Authentication token not found');
          setLoading(false);
          return;
        }
        
        // Create the encrypted payload
        const encryptedPayload = encryptData({
          module: "admin",
          endpoint: "get-dashboard-stats",
          data: { token }
        });
        
        // Send request to the backend
        const response = await axios.post(`${apiUrl}`, { payload: encryptedPayload });
        
        // Decrypt the response
        const data = decryptData(response.data.data);
        setStats(data);
        
      } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-loader">
          <Spinner animation="border" className="admin-spinner" />
          <p className="admin-loading-text">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="admin-alert admin-alert-danger">
          <h4 className="admin-alert-title">Error</h4>
          <p>{error}</p>
          <button type="button" className="admin-alert-close" onClick={() => setError(null)}>×</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <h2 className="admin-page-title">Admin Dashboard</h2>
      
      {/* User, Campaign, and Credit Stats */}
      <div className="admin-stats-container">
        {/* User Stats */}
        <div className="admin-stat-section">
          <h3 className="admin-stat-header user-stats">User Statistics</h3>
          <div className="admin-stats-grid">
            <div className="admin-stat-box">
              <div className="admin-stat-value">{stats?.userStats.total || 0}</div>
              <div className="admin-stat-label">Total Users</div>
            </div>
            <div className="admin-stat-box">
              <div className="admin-stat-value">{stats?.userStats.newToday || 0}</div>
              <div className="admin-stat-label">New Today</div>
            </div>
          </div>
          <div className="admin-stat-action">
            <a href="/admin/users" onClick={(e) => { e.preventDefault(); navigate('/admin/users'); }}>
              Manage Users
            </a>
          </div>
        </div>
        
        {/* Campaign Stats */}
        <div className="admin-stat-section">
          <h3 className="admin-stat-header campaign-stats">Campaign Statistics</h3>
          <div className="admin-stats-grid">
            <div className="admin-stat-box">
              <div className="admin-stat-value">{stats?.campaignStats.total || 0}</div>
              <div className="admin-stat-label">Total</div>
            </div>
            <div className="admin-stat-box">
              <div className="admin-stat-value">{stats?.campaignStats.pending || 0}</div>
              <div className="admin-stat-label">Pending</div>
            </div>
            <div className="admin-stat-box">
              <div className="admin-stat-value">{stats?.campaignStats.active || 0}</div>
              <div className="admin-stat-label">Active</div>
            </div>
          </div>
          <div className="admin-stat-action">
            <a href="/admin/campaigns" onClick={(e) => { e.preventDefault(); navigate('/admin/campaigns'); }}>
              Review Campaigns
            </a>
          </div>
        </div>
        
        {/* Credit Stats */}
        <div className="admin-stat-section">
          <h3 className="admin-stat-header credit-stats">Credit Statistics</h3>
          <div className="admin-stats-grid">
            <div className="admin-stat-box">
              <div className="admin-stat-value">{stats?.creditStats.totalIssued || 0}</div>
              <div className="admin-stat-label">Issued</div>
            </div>
            <div className="admin-stat-box">
              <div className="admin-stat-value">{stats?.creditStats.totalUsed || 0}</div>
              <div className="admin-stat-label">Used</div>
            </div>
            <div className="admin-stat-box">
              <div className="admin-stat-value">{stats?.creditStats.currentBalance || 0}</div>
              <div className="admin-stat-label">Balance</div>
            </div>
          </div>
          <div className="admin-stat-action">
            <a href="/admin/credits" onClick={(e) => { e.preventDefault(); navigate('/admin/credits'); }}>
              Credit History
            </a>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="admin-activity-section">
        <h3 className="admin-section-header">Recent Campaign Activity</h3>
        
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <table className="admin-activity-table">
            <thead>
              <tr>
                <th>CAMPAIGN NAME</th>
                <th>STATUS</th>
                <th>USER</th>
                <th>CREATED</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentActivity.map(activity => (
                <tr key={activity.id}>
                  <td title={activity.name}>{activity.name}</td>
                  <td>
                    <span className={`admin-status-badge admin-${activity.status.toLowerCase()}`}>
                      {activity.status}
                    </span>
                  </td>
                  <td>{activity.username}</td>
                  <td>{new Date(activity.created_at).toLocaleDateString()}</td>
                  <td>
                    <a 
                      href={`/admin/campaigns/${activity.id}`}
                      className="admin-view-link"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/admin/campaigns/${activity.id}`);
                      }}
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="admin-no-data">
            <p>No recent campaign activity</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;