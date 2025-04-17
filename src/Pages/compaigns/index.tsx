import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "Slices/theme/store";
import useSidebarToggle from "Common/UseSideberToggleHooks";

// Components
import CampaignCard from "./CampaignCard";
import CampaignModal from "./CampaignModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import MergeCampaignModal from "./MergeCampaignModal"; // Import the merge modal component

// Redux actions
import {
  fetchCampaigns,
  addCampaign,
  updateCampaign,
  deleteCampaign,
  setCurrentCampaign,
  Campaign
} from "Slices/CampaignsSlice";

const Campaigns = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const themeSidebarToggle = useSidebarToggle();
  const themeType = useSelector((state: RootState) => state.theme.themeType);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { campaigns, loading, error, currentCampaign } = useSelector((state: RootState) => state.campaigns);
  console.log('campaigns are: ', campaigns)
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // State for UI
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterModel, setFilterModel] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // State for modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showMergeModal, setShowMergeModal] = useState<boolean>(false); // New state for merge modal
  
  // State for notifications
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: "",
    type: "success"
  });

  // Fetch campaigns on component mount
  useEffect(() => {
    // Don't fetch data if not authenticated
    if (!isAuthenticated) return;
    
    document.body.classList.add("campaigns-page");
    dispatch(fetchCampaigns());
    
    return () => {
      document.body.classList.remove("campaigns-page");
    };
  }, [isAuthenticated, dispatch]);

  // Show notification when there's an error or success
  useEffect(() => {
    if (error) {
      showNotification(error, "error");
    }
  }, [error]);

  // Function to show notification
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({
      show: true,
      message,
      type
    });
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Handlers for campaign actions
  const handleAddCampaign = async (campaignData: {
    name: string;
    description: string;
    model: string;
    selectedModels?: string[];
    image: string | File | null;
    campaignType: string;
    is_model_campaign: boolean;
    is_product_campaign: boolean;
  }) => {
    try {
      // Validate required fields
      if (!campaignData.name || !campaignData.description) {
        showNotification("Campaign name and description are required.", "error");
        return;
      }
  
      // Validate model selection
      if (!campaignData.selectedModels || campaignData.selectedModels.length === 0) {
        showNotification("Please select at least one model.", "error");
        return;
      }
  
      // Validate campaign type
      if (!campaignData.campaignType) {
        showNotification("Please select a campaign type.", "error");
        return;
      }
  
      // Convert image string to File if it's a dataURL (from CampaignModal)
      let imageFile: File | null = null;
      if (campaignData.image && typeof campaignData.image === 'string' && campaignData.image.startsWith('data:')) {
        // Convert data URL to File object
        const response = await fetch(campaignData.image);
        const blob = await response.blob();
        imageFile = new File([blob], "campaign-image.jpg", { type: "image/jpeg" });
      } else if (campaignData.image instanceof File) {
        imageFile = campaignData.image;
      }
  
      // Dispatch the action and wait for it to complete
      await dispatch(addCampaign({
        name: campaignData.name,
        description: campaignData.description,
        modelName: campaignData.model || 'General', // For backward compatibility
        selectedModels: campaignData.selectedModels, // Add selected models
        image: imageFile,
        // Add campaign type information
        campaignType: campaignData.campaignType,
        is_model_campaign: campaignData.is_model_campaign,
        is_product_campaign: campaignData.is_product_campaign
      })).unwrap();
  
      // Close modal and show success notification
      setShowAddModal(false);
      showNotification("Campaign added successfully!", "success");
      
      // Refresh the campaigns list immediately after adding
      dispatch(fetchCampaigns());
    } catch (err: any) {
      console.error("Failed to add campaign:", err);
      showNotification(err?.message || "Failed to add campaign.", "error");
    }
  };

  const handleEditCampaign = async (updatedCampaign: Campaign) => {
    try {
      // Validate required fields
      if (!updatedCampaign.name || !updatedCampaign.description) {
        showNotification("Campaign name and description are required.", "error");
        return;
      }

      // Validate model selection
      if (!updatedCampaign.selectedModels || updatedCampaign.selectedModels.length === 0) {
        showNotification("Please select at least one model.", "error");
        return;
      }

      // Convert image string to File if it's a dataURL (from CampaignModal)
      let imageFile: File | null = null;
      
      // Need to check if image is a string before using string methods
      if (updatedCampaign.image && typeof updatedCampaign.image === 'string') {
        if (updatedCampaign.image.startsWith('data:')) {
          // Convert data URL to File object
          const response = await fetch(updatedCampaign.image);
          const blob = await response.blob();
          imageFile = new File([blob], "campaign-image.jpg", { type: "image/jpeg" });
        }
      } else if (updatedCampaign.image instanceof File) {
        // This is already a File object
        imageFile = updatedCampaign.image;
      }

      await dispatch(updateCampaign({
        campaignData: {
          ...updatedCampaign,
          model_name: updatedCampaign.model || updatedCampaign.model_name || 'General' // For backward compatibility
        },
        image: imageFile
      })).unwrap();

      setShowEditModal(false);
      dispatch(setCurrentCampaign(null));
      showNotification("Campaign updated successfully!", "success");
      
      // Refresh the campaigns list
      dispatch(fetchCampaigns());
    } catch (err: any) {
      console.error("Failed to update campaign:", err);
      showNotification(err?.message || "Failed to update campaign.", "error");
    }
  };

  const handleDeleteCampaign = async () => {
    if (currentCampaign) {
      try {
        await dispatch(deleteCampaign({
          campaignId: currentCampaign.id,
          imageUrl: (currentCampaign.image_url || currentCampaign.image || '') as string
        })).unwrap();

        setShowDeleteModal(false);
        dispatch(setCurrentCampaign(null));
        showNotification("Campaign deleted successfully!", "success");
        
        // Refresh the campaigns list
        dispatch(fetchCampaigns());
      } catch (err: any) {
        console.error("Failed to delete campaign:", err);
        showNotification(err?.message || "Failed to delete campaign.", "error");
      }
    }
  };

  // Handler for merge notification success
  const handleMergeSuccess = (message: string) => {
    showNotification(message, "success");
    // Refresh campaigns after merge is initiated
    dispatch(fetchCampaigns());
  };

  const openEditModal = (campaign: Campaign) => {
    dispatch(setCurrentCampaign(campaign));
    setShowEditModal(true);
  };

  const openDeleteModal = (campaign: Campaign) => {
    dispatch(setCurrentCampaign(campaign));
    setShowDeleteModal(true);
  };

  // Normalize and standardize campaign data for display with defensive coding
  const normalizedCampaigns = Array.isArray(campaigns) ? campaigns.map(campaign => {
    // Skip invalid campaign entries
    if (!campaign || typeof campaign !== 'object') {
      return null;
    }

    return {
      id: campaign.id ?? 'unknown',
      name: campaign.name ?? 'Untitled Campaign',
      description: campaign.description ?? 'No description',
      model: campaign.model || campaign.model_name || 'General',
      selectedModels: campaign.selectedModels || [],
      image: campaign.image || campaign.image_url || '',
      createdAt: campaign.createdAt || campaign.created_at || '',
      status: campaign.status || 'draft',
      is_built: campaign.is_built || false
    };
  }).filter(Boolean) : []; // filter(Boolean) removes null entries

  // Filter and sort campaigns with added data validation
  const filteredCampaigns = normalizedCampaigns
    .filter(campaign => {
      // Skip invalid campaign entries
      if (!campaign) return false;

      // Defensive checks for campaign properties
      const name = campaign.name || '';
      const description = campaign.description || '';
      const model = campaign.model || '';
      const selectedModels = campaign.selectedModels || [];

      const matchesSearch = 
        name.toLowerCase().includes((searchQuery || '').toLowerCase()) || 
        description.toLowerCase().includes((searchQuery || '').toLowerCase());
        
      // Check if the filter matches any of the selected models
      const matchesModel = filterModel === 'all' || 
                          model === filterModel || 
                          (selectedModels.length > 0 && selectedModels.some(m => m === filterModel));
      
      return matchesSearch && matchesModel;
    })
    .sort((a, b) => {
      // Sort with null checks
      if (sortBy === 'newest') {
        const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      } else if (sortBy === 'oldest') {
        const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateA - dateB;
      } else if (sortBy === 'alphabetical') {
        return (a?.name || '').localeCompare(b?.name || '');
      }
      return 0;
    });

  // Check if merge is possible (need at least 2 built and active campaigns)
  const builtActiveCampaigns = normalizedCampaigns.filter(c => 
    c && c.status && (c.status === 'ACTIVE' || c.status === 'active') && c.is_built
  );
  const canMerge = builtActiveCampaigns.length >= 2;

  // Early return if not authenticated
  if (!isAuthenticated) {
    return null; // Return null to prevent render while redirecting
  }

  return (
    <div className={`main-center-content-m-left ${themeSidebarToggle ? "collapsed" : ""}`}>
      {/* Custom notification */}
      {notification.show && (
        <div className={`notification-toast ${notification.type}`}>
          <div className="notification-content">
            <i className={`fa-solid ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
            <span>{notification.message}</span>
          </div>
          <button 
            className="close-notification" 
            onClick={() => setNotification(prev => ({ ...prev, show: false }))}
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
      )}

      <div className="campaigns-container">
        <div className="campaigns-header">
          <div>
            <h1>My Campaigns</h1>
            <p>Manage and create AI-powered marketing campaigns</p>
          </div>
          <div className="campaign-header-buttons">
            {/* Add new Merge Campaigns button */}
            <button 
              className={`rts-btn ${canMerge ? 'btn-secondary' : 'btn-disabled'} merge-campaign-btn`}
              onClick={() => setShowMergeModal(true)}
              disabled={!canMerge}
              title={!canMerge ? "Need at least 2 active and built campaigns to merge" : ""}
            >
              <i className="fa-solid fa-object-group"></i>
              Merge Campaigns
            </button>
            <button 
              className="rts-btn btn-primary add-campaign-btn"
              onClick={() => setShowAddModal(true)}
            >
              <i className="fa-solid fa-plus"></i>
              New Campaign
            </button>
          </div>
        </div>

        <div className="campaigns-filters">
          <div className="search-filter">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input 
              type="text" 
              placeholder="Search campaigns..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="model-sort-filters">
            <div className="model-filter">
              <span>Model:</span>
              <select 
                value={filterModel}
                onChange={(e) => setFilterModel(e.target.value)}
              >
                <option value="all">All Models</option>
                <option value="image-generation">Image Generation</option>
                <option value="text-generation">Text Generation</option>
                <option value="multi-modal">Multi-modal</option>
              </select>
            </div>
            
            <div className="sort-filter">
              <span>Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>

        <div className="campaigns-content-wrapper">
          {loading ? (
            <div className="campaigns-loading">
              <div className="spinner"></div>
              <p>Loading campaigns...</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="no-campaigns">
              <div className="no-campaigns-icon">
                <i className="fa-regular fa-folder-open"></i>
              </div>
              <h3>No campaigns found</h3>
              {searchQuery || filterModel !== 'all' ? (
                <p>Try adjusting your search or filters</p>
              ) : (
                <p>Create your first campaign to get started</p>
              )}
              <button 
                className="rts-btn btn-primary" 
                onClick={() => setShowAddModal(true)}
              >
                Create Campaign
              </button>
            </div>
          ) : (
            <div className="campaigns-list">
              {filteredCampaigns.map(campaign => {
                // Extra safety check before rendering
                if (!campaign || !campaign.name) return null;
                
                return (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onEdit={() => openEditModal(campaign)}
                    onDelete={() => openDeleteModal(campaign)}
                  />
                );
              })}
            </div>
          )}
        </div>
        
        <div className="campaigns-footer">
          <p>Showing {filteredCampaigns.length} of {normalizedCampaigns.length} campaigns</p>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <CampaignModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddCampaign}
          isDarkMode={themeType === 'dark'}
          title="Create New Campaign"
        />
      )}

      {showEditModal && currentCampaign && (
        <CampaignModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            dispatch(setCurrentCampaign(null));
          }}
          onSave={handleEditCampaign}
          isDarkMode={themeType === 'dark'}
          title="Edit Campaign"
          campaign={{
            id: currentCampaign.id.toString(),
            name: currentCampaign.name || '',
            description: currentCampaign.description || '',
            model: currentCampaign.model || currentCampaign.model_name || 'General',
            selectedModels: currentCampaign.selectedModels || [],
            image: currentCampaign.image || currentCampaign.image_url || '',
            createdAt: currentCampaign.createdAt || currentCampaign.created_at || '',
            status: currentCampaign.status || 'draft'
          }}
        />
      )}

      {showDeleteModal && currentCampaign && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            dispatch(setCurrentCampaign(null));
          }}
          onConfirm={handleDeleteCampaign}
          isDarkMode={themeType === 'dark'}
          campaignName={currentCampaign.name || 'this campaign'}
        />
      )}

      {/* Add the Merge Campaign Modal */}
      {showMergeModal && (
        <MergeCampaignModal
          isOpen={showMergeModal}
          onClose={() => setShowMergeModal(false)}
          campaigns={normalizedCampaigns}
          isDarkMode={themeType === 'dark'}
        />
      )}
    </div>
  );
};

export default Campaigns;