// src/Pages/Admin/CampaignReview.tsx
import React, { useEffect, useState } from 'react';
import { Spinner, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import encryptData from 'utils/encryptData';
import decryptData from 'utils/decryptData';
// Import admin styles
import '../../assets/scss/admin/admin.scss';

interface Campaign {
  id: number;
  name: string;
  description: string;
  image_url: string;
  created_at: string;
  images_count: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const CampaignReview: React.FC = () => {
  const navigate = useNavigate();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [reviewData, setReviewData] = useState({
    decision: 'APPROVED',
    adminNotes: ''
  });
  const [reviewLoading, setReviewLoading] = useState<boolean>(false);

  // Load pending campaigns with pagination
  const fetchPendingCampaigns = async (page = 1) => {
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
        endpoint: "get-pending-campaigns",
        data: { 
          token,
          page,
          limit: pagination.limit
        }
      });
      
      // Send request to the backend
      const response = await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      
      // Decrypt the response
      const data = decryptData(response.data.data);
      setCampaigns(data.campaigns);
      setPagination(data.pagination);
      
    } catch (error) {
      console.error('Error fetching pending campaigns:', error);
      setError('Failed to load pending campaigns');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPendingCampaigns(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle pagination click
  const handlePageChange = (page: number) => {
    fetchPendingCampaigns(page);
  };

  // Open review modal
  const handleReviewCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setReviewData({
      decision: 'APPROVED',
      adminNotes: ''
    });
    setShowReviewModal(true);
  };

  // Handle form input changes
  const handleReviewChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReviewData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit review decision
  const handleSubmitReview = async () => {
    if (!selectedCampaign) return;
    
    try {
      setReviewLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL;
      const token = localStorage.getItem('accessToken');
      
      // Create the encrypted payload
      const encryptedPayload = encryptData({
        module: "admin",
        endpoint: "review-campaign",
        data: {
          token,
          campaignId: selectedCampaign.id,
          decision: reviewData.decision,
          adminNotes: reviewData.adminNotes
        }
      });
      
      // Send request to the backend
      await axios.post(`${apiUrl}`, { payload: encryptedPayload });
      
      // Refresh campaign list
      fetchPendingCampaigns(pagination.page);
      
      // Close modal
      setShowReviewModal(false);
      
    } catch (error) {
      console.error('Error reviewing campaign:', error);
      setError('Failed to submit campaign review');
    } finally {
      setReviewLoading(false);
    }
  };

  // View campaign details
  const handleViewCampaign = (campaignId: number) => {
    navigate(`/admin/campaigns/${campaignId}`);
  };

  // Generate pagination items
  const renderPagination = () => {
    if (pagination.pages <= 1) return null;
    
    return (
      <div className="admin-pagination-container">
        <div className="admin-pagination">
          <div className="admin-page-item">
            <button 
              className={`admin-page-link ${pagination.page === 1 ? 'admin-disabled' : ''}`}
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
                <div key={pageNum} className="admin-page-item">
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
              className={`admin-page-link ${pagination.page === pagination.pages ? 'admin-disabled' : ''}`}
              onClick={() => pagination.page < pagination.pages && handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`admin-campaign-review ${campaigns.length === 1 ? 'single-card-view' : ''}`}>
      <div className="admin-page-header">
        <h2 className="admin-page-title">Campaign Review</h2>
        <span className="admin-pending-count">
          {pagination.total} Pending
        </span>
      </div>
      
      {error && (
        <div className="admin-alert admin-alert-danger">
          <p>{error}</p>
          <button type="button" className="admin-alert-close" onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {loading && !campaigns.length ? (
        <div className="admin-loader">
          <Spinner animation="border" className="admin-spinner" />
          <p className="admin-loading-text">Loading pending campaigns...</p>
        </div>
      ) : (
        <>
          {!campaigns.length ? (
            <div className="admin-alert admin-alert-success">
              <h4 className="admin-alert-title">No Pending Campaigns</h4>
              <p>All campaigns have been reviewed. Great job!</p>
            </div>
          ) : (
            <div className="admin-campaigns-grid">
              {campaigns.map(campaign => (
                <div key={campaign.id} className="admin-campaign-card">
                  <div className="admin-image-container">
                    <img 
                      src={campaign.image_url} 
                      alt={campaign.name}
                      className="admin-campaign-image"
                      onError={(e) => { 
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/280x160?text=No+Image'; 
                      }}
                    />
                  </div>
                  <div className="admin-campaign-content">
                    <h3 className="admin-campaign-title" title={campaign.name}>{campaign.name}</h3>
                    <div className="admin-campaign-author">by {campaign.user.username}</div>
                    <div className="admin-campaign-description" title={campaign.description}>
                      {campaign.description}
                    </div>
                    <div className="admin-campaign-meta">
                      <div>{new Date(campaign.created_at).toLocaleDateString()}</div>
                      <div>{campaign.images_count} images</div>
                    </div>
                  </div>
                  <div className="admin-campaign-actions">
                    <button 
                      className="admin-action-button admin-view-button"
                      onClick={() => handleViewCampaign(campaign.id)}
                    >
                      View
                    </button>
                    <button 
                      className="admin-action-button admin-review-button"
                      onClick={() => handleReviewCampaign(campaign)}
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Add empty placeholders for grid consistency when displaying fewer items */}
              {campaigns.length === 1 && (
                <>
                  <div className="admin-campaign-card invisible"></div>
                  <div className="admin-campaign-card invisible"></div>
                </>
              )}
              
              {campaigns.length === 2 && (
                <div className="admin-campaign-card invisible"></div>
              )}
            </div>
          )}
          
          {renderPagination()}
        </>
      )}
      
      {/* Review Campaign Modal */}
      <Modal 
        show={showReviewModal} 
        onHide={() => setShowReviewModal(false)} 
        centered
        className="admin-review-modal"
        backdrop="static"
        size="lg"
      >
        <Modal.Header closeButton className="admin-modal-header">
          <Modal.Title className="admin-modal-title">Review Campaign</Modal.Title>
        </Modal.Header>
        <Modal.Body className="admin-modal-body">
          {selectedCampaign && (
            <div className="admin-modal-content-grid">
              {/* Left Column - Campaign Info & Form Controls */}
              <div className="admin-modal-left-column">
                <div className="admin-campaign-details">
                  <h5 className="admin-preview-title">{selectedCampaign.name}</h5>
                  <p className="admin-preview-author">by {selectedCampaign.user.username}</p>
                  
                  {selectedCampaign.description && (
                    <div className="admin-preview-description">
                      <p>{selectedCampaign.description}</p>
                    </div>
                  )}
                </div>
                
                <div className="admin-form-controls">
                  <div className="admin-form-group">
                    <label htmlFor="decision-select">Decision</label>
                    <select
                      id="decision-select"
                      name="decision"
                      className="admin-form-control"
                      value={reviewData.decision}
                      onChange={handleReviewChange}
                    >
                      <option value="APPROVED">Approve Campaign</option>
                      <option value="REJECTED">Reject Campaign</option>
                    </select>
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="admin-notes">
                      Admin Notes {reviewData.decision === 'REJECTED' && '(Required)'}
                    </label>
                    <textarea
                      id="admin-notes"
                      rows={5}
                      name="adminNotes"
                      className="admin-form-control"
                      value={reviewData.adminNotes}
                      onChange={handleReviewChange}
                      placeholder={reviewData.decision === 'REJECTED' 
                        ? 'Please explain why this campaign is being rejected' 
                        : 'Optional notes for the campaign owner'
                      }
                      required={reviewData.decision === 'REJECTED'}
                    />
                    {reviewData.decision === 'REJECTED' && !reviewData.adminNotes.trim() && (
                      <div className="admin-form-text">Please provide a reason for rejection</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right Column - Campaign Image */}
              <div className="admin-modal-right-column">
                <div className="admin-preview-image-container">
                  <img 
                    src={selectedCampaign.image_url} 
                    alt={selectedCampaign.name}
                    className="admin-preview-image"
                    onError={(e) => { 
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/400x300?text=No+Image'; 
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="admin-modal-footer">
          <button 
            type="button" 
            className="admin-cancel-button"
            onClick={() => setShowReviewModal(false)}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className={reviewData.decision === 'APPROVED' ? 'admin-approve-button' : 'admin-reject-button'}
            onClick={handleSubmitReview}
            disabled={reviewLoading || (reviewData.decision === 'REJECTED' && !reviewData.adminNotes.trim())}
          >
            {reviewLoading ? (
              <>
                <span className="spinner"></span>
                {reviewData.decision === 'APPROVED' ? 'Approving...' : 'Rejecting...'}
              </>
            ) : (
              reviewData.decision === 'APPROVED' ? 'Approve Campaign' : 'Reject Campaign'
            )}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CampaignReview;