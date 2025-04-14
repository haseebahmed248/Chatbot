import React, { useState, useRef, useEffect } from 'react';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaignData: any) => void;
  isDarkMode: boolean;
  title: string;
  campaign?: {
    id: string;
    name: string;
    description: string;
    model: string;
    selectedModels?: string[];
    image: string | File;
    createdAt: string;
    status: string;
  };
}

const CampaignModal: React.FC<CampaignModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isDarkMode,
  title,
  campaign
}) => {
  // Form state
  const [name, setName] = useState<string>(campaign?.name || '');
  const [description, setDescription] = useState<string>(campaign?.description || '');
  const [selectedModels, setSelectedModels] = useState<string[]>(campaign?.selectedModels || []);
  const [mainImage, setMainImage] = useState<string | File | null>(campaign?.image || null);
  
  // Errors state
  const [nameError, setNameError] = useState<string>('');
  const [descriptionError, setDescriptionError] = useState<string>('');
  const [modelError, setModelError] = useState<string>('');
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Available models with pricing
  const modelOptions = [
    { id: "image-generation", name: "Image Generation", price: 0.10 },
    { id: "text-generation", name: "Text Generation", price: 0.05 },
    { id: "multi-modal", name: "Multi-modal", price: 0.15 }
  ];
  
  // Initialize form when editing existing campaign
  useEffect(() => {
    if (campaign) {
      setName(campaign.name || '');
      setDescription(campaign.description || '');
      
      if (campaign.selectedModels && campaign.selectedModels.length > 0) {
        setSelectedModels(campaign.selectedModels);
      } else if (campaign.model) {
        // Convert legacy single model to selectedModels array
        const modelId = modelOptions.find(m => m.name === campaign.model)?.id;
        if (modelId) {
          setSelectedModels([modelId]);
        }
      }
      
      setMainImage(campaign.image || null);
    }
  }, [campaign]);

  // Handler for main image upload
  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMainImage(file);
    }
  };

  // Toggle model selection
  const toggleModelSelection = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      setSelectedModels(selectedModels.filter(id => id !== modelId));
    } else {
      setSelectedModels([...selectedModels, modelId]);
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    let isValid = true;
    
    if (!name.trim()) {
      setNameError('Campaign name is required');
      isValid = false;
    } else {
      setNameError('');
    }
    
    if (!description.trim()) {
      setDescriptionError('Campaign description is required');
      isValid = false;
    } else {
      setDescriptionError('');
    }
    
    if (selectedModels.length === 0) {
      setModelError('Please select at least one model');
      isValid = false;
    } else {
      setModelError('');
    }
    
    return isValid;
  };

  // Form submission
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    // Get primary model for backward compatibility
    const primaryModel = selectedModels.length > 0 
      ? modelOptions.find(m => m.id === selectedModels[0])?.name || 'General'
      : 'General';
    
    const campaignData = {
      ...(campaign?.id ? { id: campaign.id } : {}),
      name,
      description,
      model: primaryModel, // For backward compatibility
      selectedModels,
      image: mainImage
    };
    
    onSave(campaignData);
  };

  // If modal is not open, don't render
  if (!isOpen) return null;

  return (
    <div className="campaign-modal-overlay">
      <div className="campaign-modal">
        <div className="campaign-modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <div className="campaign-modal-body">
          <div className="form-group">
            <label htmlFor="campaign-name">Campaign Name</label>
            <input
              id="campaign-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter campaign name"
              className={nameError ? 'error' : ''}
            />
            {nameError && <span className="error-message">{nameError}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="campaign-description">Campaign Description</label>
            <textarea
              id="campaign-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter campaign description"
              rows={4}
              className={descriptionError ? 'error' : ''}
            />
            {descriptionError && <span className="error-message">{descriptionError}</span>}
          </div>
          
          <div className="form-group">
            <label>AI Models <span className="model-helper-text">(Select multiple as needed)</span></label>
            <div className={`model-checkbox-container ${modelError ? 'error' : ''}`}>
              {modelOptions.map(model => (
                <div key={model.id} className="model-checkbox-item">
                  <label className="checkbox-label-container">
                    <input
                      type="checkbox"
                      checked={selectedModels.includes(model.id)}
                      onChange={() => toggleModelSelection(model.id)}
                    />
                    <span className="checkmark"></span>
                    <span className="model-name">{model.name}</span>
                    <span className="model-price">${model.price.toFixed(2)} / request</span>
                  </label>
                </div>
              ))}
            </div>
            {modelError && <span className="error-message">{modelError}</span>}
          </div>
          
          <div className="form-group">
            <label>Campaign Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleMainImageUpload}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
            <div 
              className="image-upload-area" 
              onClick={() => fileInputRef.current?.click()}
            >
              {mainImage ? (
                <div className="image-preview">
                  <img 
                    src={typeof mainImage === 'string' ? mainImage : URL.createObjectURL(mainImage)} 
                    alt="Campaign preview" 
                  />
                  <div className="image-overlay">
                    <span>Change Image</span>
                  </div>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span>Upload Image</span>
                  <p>Click to browse or drag and drop</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              className="btn-secondary" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="btn-primary" 
              onClick={handleSubmit}
            >
              {campaign ? 'Update Campaign' : 'Create Campaign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignModal;