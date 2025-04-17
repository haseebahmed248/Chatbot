import React, { useState } from "react";

interface MergeCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: any[];
  isDarkMode: boolean;
}

const MergeCampaignModal: React.FC<MergeCampaignModalProps> = ({ 
  isOpen, 
  onClose, 
  campaigns, 
  isDarkMode 
}) => {
  const [modelCampaignId, setModelCampaignId] = useState<string>("");
  const [productCampaignId, setProductCampaignId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate selections
    if (!modelCampaignId || !productCampaignId) {
      setError("Please select both campaigns");
      return;
    }

    if (modelCampaignId === productCampaignId) {
      setError("You must select two different campaigns");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Send request to merge API
      const response = await fetch("http://149.40.228.126:8000/requestMerge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model_campaign_id: modelCampaignId,
          product_campaign_id: productCampaignId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to initiate merge");
      }

      setSuccess("Merge request initiated successfully! You will be notified when the process is complete.");
      
      // Reset form after successful submission
      setModelCampaignId("");
      setProductCampaignId("");
      
      // Close modal after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message || "An error occurred while initiating the merge");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter campaigns that are candidates for merging (must be built and active)
  const availableCampaigns = campaigns.filter(c => 
    c && 
    c.status && 
    (c.status === 'ACTIVE' || c.status === 'active') && 
    c.is_built === true
  );
  
  // Additional helper to display the number of campaigns available
  const availableCampaignCount = availableCampaigns.length;

  return (
    <div className="campaign-modal-overlay">
      <div className="campaign-modal merge-modal">
        <div className="campaign-modal-header">
          <h3>Merge Campaigns</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="campaign-modal-body">
          {availableCampaignCount < 2 ? (
            <div className="merge-error">
              <div className="text-center">
                <i className="fa-solid fa-exclamation-circle fa-3x mb-3" style={{ color: "#F59E0B", marginBottom: "15px", display: "block" }}></i>
                <h4>Not Enough Eligible Campaigns</h4>
                <p>You need at least two active and built campaigns to merge.</p>
                <p className="text-muted" style={{ fontSize: "0.9rem", marginTop: "10px" }}>
                  Campaigns must have status "ACTIVE" and be marked as built to be eligible for merging.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="modelCampaign">Select Model Campaign:</label>
                <select
                  id="modelCampaign"
                  value={modelCampaignId}
                  onChange={(e) => setModelCampaignId(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">-- Select Model Campaign --</option>
                  {availableCampaigns
                    .map((campaign) => (
                      <option 
                        key={`model-${campaign.id}`} 
                        value={campaign.id}
                        disabled={campaign.id === productCampaignId}
                      >
                        {campaign.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="productCampaign">Select Product Campaign:</label>
                <select
                  id="productCampaign"
                  value={productCampaignId}
                  onChange={(e) => setProductCampaignId(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">-- Select Product Campaign --</option>
                  {availableCampaigns
                    .map((campaign) => (
                      <option 
                        key={`product-${campaign.id}`} 
                        value={campaign.id}
                        disabled={campaign.id === modelCampaignId}
                      >
                        {campaign.name}
                      </option>
                    ))}
                </select>
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-sm"></span> Processing...
                    </>
                  ) : (
                    "Initiate Merge"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default MergeCampaignModal;