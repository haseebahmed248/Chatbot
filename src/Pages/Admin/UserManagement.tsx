// src/Pages/Admin/UserManagement.tsx
import React, { useEffect, useState } from 'react';
import { Spinner, Modal } from 'react-bootstrap';
import axios from 'axios';
import encryptData from 'utils/encryptData';
import decryptData from 'utils/decryptData';
import { UserRole } from 'Slices/AuthSlice';
import { useSelector } from 'react-redux';
import { RootState } from 'Slices/theme/store';
// Import admin styles
import '../../assets/scss/admin/admin.scss';

interface User {
  id: number;
  username: string;
  email: string;
  credits: number;
  role: UserRole;
  is_verified: boolean;
  last_login?: string;
  created_at: string;
  campaignsCount: number;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const UserManagement: React.FC = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: UserRole.USER,
    is_verified: false,
    credits: 0
  });

  // Load users with pagination
  const fetchUsers = async (page = 1) => {
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
        endpoint: "get-all-users",
        data: { 
          token,
          page,
          limit: pagination.limit,
          search: searchTerm
        }
      });
      
      // Send request to the backend
      const response = await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      
      // Decrypt the response
      const data = decryptData(response.data.data);
      setUsers(data.users);
      setPagination(data.pagination);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle search
  const handleSearch = () => {
    fetchUsers(1);
  };

  // Edit user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      role: user.role as UserRole,
      is_verified: user.is_verified,
      credits: user.credits
    });
    setShowEditModal(true);
  };

  // Delete user
  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : name === 'credits' 
          ? parseInt(value) || 0 
          : value
    }));
  };

  // Submit user update
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL;
      const token = localStorage.getItem('accessToken');
      
      // Create the encrypted payload
      const encryptedPayload = encryptData({
        module: "admin",
        endpoint: "update-user",
        data: {
          token,
          userId: selectedUser.id,
          username: formData.username,
          email: formData.email,
          role: formData.role,
          isVerified: formData.is_verified,
          credits: formData.credits
        }
      });
      
      // Send request to the backend
      const response = await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      
      // Decrypt the response
      const decryptedResponse = decryptData(response.data.data);
      console.log('Update user response:', decryptedResponse);
      
      // Show success message
      setError(null);
      
      // Refresh user list
      fetchUsers(pagination.page);
      
      // Close modal
      setShowEditModal(false);
      
    } catch (error) {
      console.error('Error updating user:', error);
      
      // Try to extract the error message from the response if possible
      let errorMessage = 'Failed to update user';
      if (axios.isAxiosError(error) && error.response?.data?.data) {
        try {
          const decryptedError = decryptData(error.response.data.data);
          errorMessage = decryptedError.message || errorMessage;
        } catch (e) {
          // Decryption failed, use the default message
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Confirm user deletion
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL;
      const token = localStorage.getItem('accessToken');
      
      // Create the encrypted payload
      const encryptedPayload = encryptData({
        module: "admin",
        endpoint: "delete-user",
        data: {
          token,
          userId: selectedUser.id
        }
      });
      
      // Send request to the backend
      await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      
      // Refresh user list
      fetchUsers(pagination.page);
      
      // Close modal
      setShowDeleteModal(false);
      
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination click
  const handlePageChange = (page: number) => {
    fetchUsers(page);
  };

  // Generate pagination items
  const renderPagination = () => {
    if (pagination.pages <= 1) return null;
    
    return (
      <div className="admin-pagination">
        <div className="admin-page-item">
          <button 
            className={`admin-page-link ${pagination.page === 1 ? 'disabled' : ''}`}
            onClick={() => pagination.page > 1 && handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </button>
        </div>
        
        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
          const pageNum = Math.max(1, pagination.page - 2) + i;
          if (pageNum <= pagination.pages) {
            return (
              <div 
                key={pageNum} 
                className="admin-page-item"
              >
                <button 
                  className={`admin-page-link ${pageNum === pagination.page ? 'admin-active' : ''}`}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </button>
              </div>
            );
          }
          return null;
        })}
        
        <div className="admin-page-item">
          <button 
            className={`admin-page-link ${pagination.page === pagination.pages ? 'disabled' : ''}`}
            onClick={() => pagination.page < pagination.pages && handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Generate empty rows if needed to fill the space
  const renderEmptyRows = () => {
    // Calculate how many empty rows are needed to fill the table
    const minimumRows = 10;
    const emptyRowsNeeded = Math.max(0, minimumRows - users.length);
    
    return Array.from({ length: emptyRowsNeeded }).map((_, index) => (
      <tr key={`empty-${index}`} className="admin-empty-row">
        <td colSpan={8}>&nbsp;</td>
      </tr>
    ));
  };

  return (
    <div className="admin-user-management">
      <h2 className="admin-page-title">User Management</h2>
      
      {error && (
        <div className="admin-alert admin-alert-danger">
          <p>{error}</p>
          <button type="button" className="admin-alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {/* Search Area */}
      <div className="admin-search-container">
        <div className="admin-search-area">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="admin-search-button" onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>
      
      {/* Table and Loading States */}
      <div className="admin-users-table-container">
        {loading && !users.length ? (
          <div className="admin-loader">
            <Spinner animation="border" className="admin-spinner" />
            <p className="admin-loading-text">Loading users...</p>
          </div>
        ) : (
          <>
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>USERNAME</th>
                  <th>EMAIL</th>
                  <th>ROLE</th>
                  <th>VERIFIED</th>
                  <th>CREDITS</th>
                  <th>CAMPAIGNS</th>
                  <th>LAST LOGIN</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  <>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`admin-role-badge admin-role-${user.role.toLowerCase()}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          {user.is_verified ? (
                            <span className="admin-verified-status">Verified</span>
                          ) : (
                            <span className="admin-pending-status">Pending</span>
                          )}
                        </td>
                        <td>{user.credits}</td>
                        <td>{user.campaignsCount}</td>
                        <td>{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                        <td>
                          <div className="admin-action-buttons">
                            <button
                              type="button"
                              className="admin-edit-button"
                              onClick={() => handleEditUser(user)}
                            >
                              Edit
                            </button>
                            
                            {currentUser?.id !== user.id.toString() && (
                              <button
                                type="button"
                                className="admin-delete-button"
                                onClick={() => handleDeleteUser(user)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {renderEmptyRows()}
                  </>
                ) : (
                  <tr>
                    <td colSpan={8} className="admin-no-data">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {renderPagination()}
          </>
        )}
      </div>
      
      {/* Edit User Modal */}
<Modal 
  show={showEditModal} 
  onHide={() => setShowEditModal(false)} 
  centered
  className="admin-user-modal"
  backdrop="static"
>
  <Modal.Header closeButton className="admin-modal-header edit-user-header">
    <Modal.Title className="admin-modal-title">Edit User</Modal.Title>
  </Modal.Header>
  <Modal.Body className="admin-modal-body">
    <div className="admin-form-group">
      <label>Username</label>
      <input
        type="text"
        name="username"
        className="admin-form-control"
        value={formData.username}
        onChange={handleFormChange}
        placeholder="Enter username"
      />
    </div>
    
    <div className="admin-form-group">
      <label>Email</label>
      <input
        type="email"
        name="email"
        className="admin-form-control"
        value={formData.email}
        onChange={handleFormChange}
        placeholder="Enter email address"
      />
    </div>
    
    <div className="admin-form-group">
      <label>Role</label>
      <select
        name="role"
        className="admin-form-control"
        value={formData.role}
        onChange={handleFormChange}
      >
        <option value={UserRole.USER}>User</option>
        <option value={UserRole.ADMIN}>Admin</option>
      </select>
    </div>
    
    <div className="admin-form-group">
      <label>Verification Status</label>
      <select
        name="is_verified"
        className="admin-form-control"
        value={formData.is_verified.toString()}
        onChange={(e) => {
          const boolValue = e.target.value === 'true';
          setFormData(prev => ({
            ...prev,
            is_verified: boolValue
          }));
        }}
      >
        <option value="true">Verified</option>
        <option value="false">Pending</option>
      </select>
    </div>
    
    <div className="admin-form-group">
      <label>Credits</label>
      <input
        type="number"
        name="credits"
        className="admin-form-control"
        value={formData.credits}
        onChange={handleFormChange}
        placeholder="Enter credit amount"
        min="0"
      />
    </div>
  </Modal.Body>
  <Modal.Footer className="admin-modal-footer">
    <button 
      type="button" 
      className="admin-cancel-button"
      onClick={() => setShowEditModal(false)}
    >
      Cancel
    </button>
    <button 
      type="button" 
      className="admin-save-button"
      onClick={handleUpdateUser}
      disabled={loading}
    >
      {loading ? (
        <>
          <span className="spinner"></span>
          Updating...
        </>
      ) : (
        'Save Changes'
      )}
    </button>
  </Modal.Footer>
</Modal>

{/* Delete User Confirmation Modal (updated) */}
<Modal 
  show={showDeleteModal} 
  onHide={() => setShowDeleteModal(false)} 
  centered
  className="admin-user-modal"
  backdrop="static"
>
  <Modal.Header closeButton className="admin-modal-header delete-user-header">
    <Modal.Title className="admin-modal-title">Confirm Deletion</Modal.Title>
  </Modal.Header>
  <Modal.Body className="admin-modal-body">
    <p>
      Are you sure you want to delete user <span className="user-highlight">{selectedUser?.username}</span>?
    </p>
    <div className="admin-warning-message">
      <p>
        This action will delete all campaigns, images, and data associated with this account. 
        This action cannot be undone.
      </p>
    </div>
  </Modal.Body>
  <Modal.Footer className="admin-modal-footer">
    <button 
      type="button" 
      className="admin-cancel-button"
      onClick={() => setShowDeleteModal(false)}
    >
      Cancel
    </button>
    <button 
      type="button" 
      className="admin-delete-button confirm-delete"
      onClick={handleConfirmDelete}
      disabled={loading}
    >
      {loading ? (
        <>
          <span className="spinner"></span>
          Deleting...
        </>
      ) : (
        'Delete User'
      )}
    </button>
  </Modal.Footer>
</Modal>
    </div>
  );
};

export default UserManagement;