import React from "react";
import { Link } from "react-router-dom";

interface Campaign {
  id: string | number;
  name: string;
  description: string;
  model?: string;
  selectedModels?: string[];
  image: string;
  createdAt: string;
  status?: string;
}

interface CampaignCardProps {
  campaign: Campaign;
  onEdit: () => void;
  onDelete: () => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onEdit, onDelete }) => {
  // Helper function for model icon and class
  const getModelInfo = (modelId: string) => {
    const modelMap: Record<string, { icon: string, className: string, label: string }> = {
      "image-generation": {
        icon: "fa-image",
        className: "image-generation",
        label: "Image Generation"
      },
      "text-generation": {
        icon: "fa-text-height", 
        className: "text-generation",
        label: "Text Generation"
      },
      "multi-modal": {
        icon: "fa-layer-group",
        className: "multi-modal",
        label: "Multi-modal"
      }
    };

    return modelMap[modelId] || { 
      icon: "fa-cube", 
      className: "", 
      label: modelId
    };
  };

  // Simple function to format relative time without date-fns
  const getRelativeTimeString = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Unknown date";
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffMonths = Math.floor(diffDays / 30);
      
      if (diffMonths > 0) {
        return diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`;
      } else if (diffDays > 0) {
        return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
      } else if (diffHours > 0) {
        return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
      } else if (diffMinutes > 0) {
        return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
      } else {
        return "Just now";
      }
    } catch (error) {
      return "Unknown date";
    }
  };

  // Get creation date in relative format
  const timeAgo = getRelativeTimeString(campaign.createdAt);

  // Handle clicks on action buttons without triggering card click
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <Link to={`/campaign/${campaign.id}`} className="campaign-card-link">
      <div className="campaign-card">
        <div 
          className="campaign-image" 
          style={{ 
            backgroundImage: campaign.image 
              ? `url(${campaign.image})` 
              : 'linear-gradient(45deg, #2a3f5f, #4c5f99)'
          }}
        >
          {campaign.status && (
            <div className={`campaign-status ${campaign.status.toLowerCase()}`}>
              {campaign.status}
            </div>
          )}
          
          <div className="card-actions">
            <button 
              className="action-btn edit"
              onClick={(e) => handleActionClick(e, onEdit)}
              title="Edit Campaign"
            >
              <i className="fa-solid fa-pen-to-square"></i>
            </button>
            <button 
              className="action-btn delete"
              onClick={(e) => handleActionClick(e, onDelete)}
              title="Delete Campaign"
            >
              <i className="fa-solid fa-trash-alt"></i>
            </button>
          </div>
        </div>
        
        <div className="campaign-details">
          {/* Render multiple model tags if available, otherwise fallback to the single model */}
          <div className="model-tags">
            {campaign.selectedModels && campaign.selectedModels.length > 0 ? (
              campaign.selectedModels.map((modelId) => {
                const modelInfo = getModelInfo(modelId);
                return (
                  <div key={modelId} className={`model-tag ${modelInfo.className}`}>
                    <i className={`fa-solid ${modelInfo.icon}`}></i>
                    <span>{modelInfo.label}</span>
                  </div>
                );
              })
            ) : (
              campaign.model && (
                <div className={`model-tag ${campaign.model.toLowerCase().replace(/\s+/g, '-')}`}>
                  <i className={`fa-solid ${
                    campaign.model.includes('Image') ? 'fa-image' : 
                    campaign.model.includes('Text') ? 'fa-text-height' : 
                    campaign.model.includes('Multi') ? 'fa-layer-group' : 'fa-cube'
                  }`}></i>
                  <span>{campaign.model}</span>
                </div>
              )
            )}
          </div>
          
          <h3 className="campaign-title">{campaign.name}</h3>
          <p className="campaign-description">{campaign.description}</p>
          
          <div className="campaign-footer">
            <div className="campaign-date">
              <i className="fa-regular fa-clock"></i>
              <span>{timeAgo}</span>
            </div>
            
            <Link to={`/campaign/${campaign.id}`} className="view-details-link">
              <span>View Details</span>
              <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CampaignCard;