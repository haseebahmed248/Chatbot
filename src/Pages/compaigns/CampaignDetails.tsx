import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "Slices/theme/store";
import { 
  fetchCampaignDetails, 
  deleteCampaignImage, 
  addCampaignImage,
  updateCampaignImage,
  updateCampaign,
  deleteCampaign,
  buildCampaign
} from "Slices/CampaignsSlice";
import useSidebarToggle from "Common/UseSideberToggleHooks";

interface CampaignImage {
  id: string;
  campaign_id: string | number;
  url: string;
  title: string;
  description: string;
  created_at: string;
}

const CampaignDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const themeSidebarToggle = useSidebarToggle();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { currentCampaign, campaignImages, loading, error } = useSelector(
    (state: RootState) => state.campaigns
  );

  // Active tab state
  const [activeTab, setActiveTab] = useState<'product' | 'person'>('product');

  // Model build state - Added 'pending' state
  const [modelState, setModelState] = useState<'disabled' | 'ready' | 'processing' | 'pending' | 'success'>('disabled');
  // Model build state - Added 'pending' state
  const [modelState, setModelState] = useState<'disabled' | 'ready' | 'processing' | 'pending' | 'success'>('disabled');

  // Image modal states
  const [selectedImage, setSelectedImage] = useState<CampaignImage | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<CampaignImage | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Add image modal states
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [currentImageType, setCurrentImageType] = useState<'product' | 'person'>('product');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageDescriptions, setImageDescriptions] = useState<{[key: string]: string}>({});
  const [imageTitles, setImageTitles] = useState<{[key: string]: string}>({});
  const [previewUrls, setPreviewUrls] = useState<{[key: string]: string}>({});
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification state
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: "",
    type: "success"
  });
  
  // Error popup for pending campaign
  const [showPendingError, setShowPendingError] = useState(false);

  // Fetch campaign details on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    if (id) {
      dispatch(fetchCampaignDetails(id));
    }
  }, [id, isAuthenticated, dispatch, navigate]);

  // Helper function to determine campaign type
  const getCampaignTypeInfo = () => {
    // Check campaign type property first
    if (currentCampaign?.campaignType) {
      const type = currentCampaign.campaignType.toUpperCase();
      if (type === 'MODEL') {
        return { type: 'model', displayName: 'Model Campaign', icon: 'fa-user' };
      } else if (type === 'PRODUCT') {
        return { type: 'product', displayName: 'Product Campaign', icon: 'fa-box' };
      } else if (type === 'MERGED') {
        return { type: 'merged', displayName: 'Merged Campaign', icon: 'fa-object-group' };
      }
    }

    // Fall back to boolean flags
    if (currentCampaign?.is_model_campaign && currentCampaign?.is_product_campaign) {
      return { type: 'merged', displayName: 'Merged Campaign', icon: 'fa-object-group' };
    } else if (currentCampaign?.is_model_campaign) {
      return { type: 'model', displayName: 'Model Campaign', icon: 'fa-user' };
    } else if (currentCampaign?.is_product_campaign) {
      return { type: 'product', displayName: 'Product Campaign', icon: 'fa-box' };
    }

    // Default case
    return { type: 'standard', displayName: 'Standard Campaign', icon: 'fa-cube' };
  };

  // Set initial active tab based on campaign type
  useEffect(() => {
    if (currentCampaign) {
      const campaignTypeInfo = getCampaignTypeInfo();
      
      if (campaignTypeInfo.type === 'model') {
        // For model campaigns, show person tab by default
        setActiveTab('person');
        setCurrentImageType('person');
      } else if (campaignTypeInfo.type === 'product') {
        // For product campaigns, show product tab by default
        setActiveTab('product');
        setCurrentImageType('product');
      }
      // For standard and merged campaigns, keep the current active tab
    }
  }, [currentCampaign]);

  // Show notification function
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

  // Format date for display
  const formatDate = (dateString: string): string => {
    if (!dateString) return "No date";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Check if campaign is pending
  const isPendingCampaign = () => {
    return currentCampaign?.status === 'PENDING';
  };

  // Check if campaign is rejected
  const isRejectedCampaign = () => {
    return currentCampaign?.status === 'REJECTED';
  };

  // Get campaign status display info
  const getCampaignStatusInfo = () => {
    const statusMap: any = {
      'PENDING': {
        icon: 'fa-clock',
        text: 'Pending Approval',
        class: 'pending'
      },
      'APPROVED': {
        icon: 'fa-check-circle',
        text: 'Approved',
        class: 'approved'
      },
      'REJECTED': {
        icon: 'fa-times-circle',
        text: 'Rejected',
        class: 'rejected'
      },
      'ACTIVE': {
        icon: 'fa-check-circle',
        text: 'Active',
        class: 'active'
      }
    };
    
    const campaignStatus = currentCampaign?.status || 'PENDING';
    return statusMap[campaignStatus] || statusMap['PENDING'];
  };

  // Check if campaign is rejected
  const isRejectedCampaign = () => {
    return currentCampaign?.status === 'REJECTED';
  };

  // Get campaign status display info
  const getCampaignStatusInfo = () => {
    const statusMap: any = {
      'PENDING': {
        icon: 'fa-clock',
        text: 'Pending Approval',
        class: 'pending'
      },
      'APPROVED': {
        icon: 'fa-check-circle',
        text: 'Approved',
        class: 'approved'
      },
      'REJECTED': {
        icon: 'fa-times-circle',
        text: 'Rejected',
        class: 'rejected'
      },
      'ACTIVE': {
        icon: 'fa-check-circle',
        text: 'Active',
        class: 'active'
      }
    };
    
    const campaignStatus = currentCampaign?.status || 'PENDING';
    return statusMap[campaignStatus] || statusMap['PENDING'];
  };

  // Get model icon based on model type
  const getModelIcon = (modelId: string): string => {
    if (modelId === 'image-generation') {
      return 'fa-image';
    } else if (modelId === 'text-generation') {
      return 'fa-font';
    } else if (modelId === 'multi-modal') {
      return 'fa-layer-group';
    }
    
    // For backward compatibility with older model naming
    const modelLower = modelId?.toLowerCase() || '';
    
    if (modelLower.includes('image')) {
      return 'fa-image';
    } else if (modelLower.includes('text')) {
      return 'fa-font';
    } else if (modelLower.includes('multi')) {
      return 'fa-layer-group';
    }
    
    return 'fa-robot';
  };

  // Get model class based on model type
  const getModelClass = (modelId: string): string => {
    if (modelId === 'image-generation') {
      return 'image-generation';
    } else if (modelId === 'text-generation') {
      return 'text-generation';
    } else if (modelId === 'multi-modal') {
      return 'multi-modal';
    }
    
    // For backward compatibility with older model naming
    const modelLower = modelId?.toLowerCase() || '';
    
    if (modelLower.includes('image')) {
      return 'image-generation';
    } else if (modelLower.includes('text')) {
      return 'text-generation';
    } else if (modelLower.includes('multi')) {
      return 'multi-modal';
    }
    
    return '';
  };

  // Handle opening the image modal
  const openImageModal = (image: CampaignImage) => {
    setSelectedImage(image);
    setIsImageModalOpen(true);
    setEditingImage(null);
  };

  // Handle closing the image modal
  const closeImageModal = () => {
    setSelectedImage(null);
    setIsImageModalOpen(false);
    setEditingImage(null);
  };
  
  // Handle closing the pending error popup
  const closePendingErrorPopup = () => {
    setShowPendingError(false);
  };

  // Start editing an image
  const startEditingImage = (image: CampaignImage) => {
    if (isCampaignBuilt()) {
      showNotification("Cannot edit images in a built campaign", "error");
      return;
    }
    
    if (isPendingCampaign()) {
      setShowPendingError(true);
      return;
    }
    
    setEditingImage(image);
    setEditTitle(image.title || '');
    setEditDescription(image.description || '');
  };

  // Save image edits
  const saveImageEdits = async () => {
    if (!editingImage || !id) return;
    
    if (isPendingCampaign()) {
      setShowPendingError(true);
      return;
    }

    try {
      await dispatch(updateCampaignImage({
        campaignId: id,
        imageId: editingImage.id,
        title: editTitle,
        description: editDescription
      })).unwrap();

      setEditingImage(null);
      showNotification("Image details updated successfully!", "success");
      
      // Refresh campaign details
      dispatch(fetchCampaignDetails(id));
    } catch (error: any) {
      showNotification(error?.message || "Failed to update image.", "error");
    }
  };

  // Delete an image
  const handleDeleteImage = async (imageId: string) => {
    if (!id) return;
    
    if (isCampaignBuilt()) {
      showNotification("Cannot delete images from a built campaign", "error");
      return;
    }
    
    if (isPendingCampaign()) {
      setShowPendingError(true);
      return;
    }

    if (window.confirm("Are you sure you want to delete this image? This action cannot be undone.")) {
      try {
        await dispatch(deleteCampaignImage({
          campaignId: id,
          imageId
        })).unwrap();

        closeImageModal();
        showNotification("Image deleted successfully!", "success");
        
        // Refresh campaign details
        dispatch(fetchCampaignDetails(id));
      } catch (error: any) {
        showNotification(error?.message || "Failed to delete image.", "error");
      }
    }
  };

  // Open add image modal for the current tab type
  const openAddImageModal = () => {
    if (isCampaignBuilt()) {
      showNotification("Cannot add images to a built campaign", "error");
      return;
    }
    
    if (isPendingCampaign()) {
      setShowPendingError(true);
      return;
    }
    
    setIsAddImageModalOpen(true);
    
    // For specialized campaign types, always set the correct image type
    const campaignType = getCampaignTypeInfo().type;
    if (campaignType === 'model') {
      setCurrentImageType('person');
    } else if (campaignType === 'product') {
      setCurrentImageType('product');
    } else {
      // For standard/merged campaigns, use the active tab
      setCurrentImageType(activeTab);
    }
    
    setSelectedFiles([]);
    setImageDescriptions({});
    setImageTitles({});
    setPreviewUrls({});
    setCurrentFileIndex(0);
  };

  // Close add image modal
  const closeAddImageModal = () => {
    setIsAddImageModalOpen(false);
    
    // Clean up preview URLs
    Object.values(previewUrls).forEach(url => {
      URL.revokeObjectURL(url);
    });
    
    setSelectedFiles([]);
    setImageDescriptions({});
    setImageTitles({});
    setPreviewUrls({});
  };

  // Handle file input change
  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isPendingCampaign()) {
      setShowPendingError(true);
      if (e.target.files) {
        e.target.value = '';
      }
      return;
    }
    
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      
      // Create preview URLs for all files
      const newPreviewUrls: {[key: string]: string} = {};
      const newTitles: {[key: string]: string} = {};
      
      files.forEach((file, index) => {
        newPreviewUrls[`file-${index}`] = URL.createObjectURL(file);
        newTitles[`file-${index}`] = file.name.split('.')[0] || `${currentImageType} Image ${index + 1}`;
      });
      
      setPreviewUrls(newPreviewUrls);
      setImageTitles(newTitles);
      setCurrentFileIndex(0);
    }
  };

  // Function to convert image file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Get only the base64 part
        const base64String = reader.result as string;
        const base64Content = base64String.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Generate description from Gemini API
  const generateAIDescription = async (fileIndex: number) => {
    if (isPendingCampaign()) {
      setShowPendingError(true);
      return;
    }
    
    const fileId = `file-${fileIndex}`;
    const imageType = currentImageType;
    const file = selectedFiles[fileIndex];
    
    if (!file) {
      showNotification("No image found to generate description", "error");
      return;
    }
    
    try {
      // Show loading state
      showNotification("Generating description with AI...", "success");
      
      // Convert image to base64
      const base64Image = await fileToBase64(file);
      
      // Get the API key from environment variables
      const apiKey = process.env.REACT_APP_GEMENI_API_KEY;
      
      if (!apiKey) {
        throw new Error("Gemini API key not found in environment variables");
      }
      
      // Prepare the API request
      const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent";
      const url = `${endpoint}?key=${apiKey}`;
      
      // Craft an appropriate prompt based on image type
      let prompt = "";
      if (imageType === 'product') {
        prompt = "Generate a detailed, professional description of this product for an e-commerce website. Focus on its key features, appearance, potential uses, and unique selling points. Keep the tone professional and marketing-friendly.";
      } else {
        prompt = "Describe this person professionally for a marketing campaign. Focus on their appearance, demeanor, and the impression they convey. Keep the description respectful, professional, and appropriate for business contexts.";
      }
      
      // Prepare the request body
      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: file.type,
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 250
        }
      };
      
      // Make the API call
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      
      // Extract the generated text from response
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        throw new Error("No description was generated");
      }
      
      // Update the image description
      setImageDescriptions(prev => ({
        ...prev,
        [fileId]: generatedText
      }));
      
      showNotification("AI description generated!", "success");
    } catch (error: any) {
      console.error("Error generating AI description:", error);
      showNotification(`Failed to generate AI description: ${error.message}`, "error");
      
      // Fallback to placeholder descriptions if API fails
      const fallbackDescriptions = {
        product: "High-quality product with excellent craftsmanship and attention to detail.",
        person: "Professional individual with a confident and approachable demeanor."
      };
      
      setImageDescriptions(prev => ({
        ...prev,
        [fileId]: fallbackDescriptions[imageType]
      }));
    }
  };

  // Move to next image in queue
  const goToNextImage = () => {
    if (currentFileIndex < selectedFiles.length - 1) {
      setCurrentFileIndex(currentFileIndex + 1);
    }
  };

  // Move to previous image in queue
  const goToPrevImage = () => {
    if (currentFileIndex > 0) {
      setCurrentFileIndex(currentFileIndex - 1);
    }
  };

  // Add current batch of images
  const handleAddImages = async () => {
    if (isPendingCampaign()) {
      setShowPendingError(true);
      return;
    }
    
    if (!id || selectedFiles.length === 0) {
      showNotification("Please select at least one image file.", "error");
      return;
    }

    try {
      // Add each image one by one
      for (let i = 0; i < selectedFiles.length; i++) {
        const fileId = `file-${i}`;
        const file = selectedFiles[i];
        
        // Add the type prefix to the title for better categorization
        let title = imageTitles[fileId] || `Image ${i + 1}`;
        // Only add the prefix if it doesn't already exist in the title
        if (!title.toLowerCase().includes(currentImageType.toLowerCase())) {
          title = `${currentImageType}: ${title}`;
        }
        
        const description = imageDescriptions[fileId] || "";
        
        const payload = {
          campaignId: id,
          image: file,
          title: title,
          description: description
        };
        
        await dispatch(addCampaignImage(payload)).unwrap();
      }

      closeAddImageModal();
      showNotification(`${selectedFiles.length} ${currentImageType} image(s) added successfully!`, "success");
      
      // Refresh campaign details
      dispatch(fetchCampaignDetails(id));
    } catch (error: any) {
      showNotification(error?.message || "Failed to add images.", "error");
    }
  };

  // Delete the entire campaign
  const handleDeleteCampaign = async () => {
    if (!currentCampaign || !id) return;
    
    if (isCampaignBuilt()) {
      showNotification("Cannot delete a built campaign", "error");
      return;
    }
    
    if (isPendingCampaign()) {
      setShowPendingError(true);
      return;
    }

    if (window.confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) {
      try {
        await dispatch(deleteCampaign({
          campaignId: id,
          imageUrl: (currentCampaign.image_url || currentCampaign.image || '') as string
        })).unwrap();

        showNotification("Campaign deleted successfully!", "success");
        navigate('/campaigns');
      } catch (error: any) {
        showNotification(error?.message || "Failed to delete campaign.", "error");
      }
    }
  };

  // For proper categorization between product and person images
  // Check the title to see if it contains a hint about the type
  const getImageType = (image: CampaignImage): 'product' | 'person' => {
    const title = (image.title || '').toLowerCase();
    
    if (title.includes('person') || 
        title.includes('people') || 
        title.includes('portrait') || 
        title.includes('face') ||
        title.includes('profile')) {
      return 'person';
    }
    
    // Default to product
    return 'product';
  };

  // Properly categorize images based on their titles or stored metadata
  const productImages = campaignImages ? 
    campaignImages.filter(img => getImageType(img) === 'product') : 
    [];
    
  const personImages = campaignImages ? 
    campaignImages.filter(img => getImageType(img) === 'person') : 
    [];

  // Check if campaign is built
  const isCampaignBuilt = () => {
    return currentCampaign?.is_built === true;
  };

  // Updated model state logic for campaign types
  useEffect(() => {
    if (currentCampaign?.status === 'APPROVED' && isCampaignBuilt()) {
      // Campaign is fully approved and built
      setModelState('success');
    } else if (currentCampaign?.status === 'APPROVED' && !isCampaignBuilt()) {
      // Approved but not built yet - check if it's ready based on campaign type
      const campaignType = getCampaignTypeInfo().type;
      
      if (campaignType === 'model') {
        // Model campaigns only need person images
        if (personImages.length > 0) {
          setModelState('ready');
        } else {
          setModelState('disabled');
        }
      } else if (campaignType === 'product') {
        // Product campaigns only need product images
        if (productImages.length > 0) {
          setModelState('ready');
        } else {
          setModelState('disabled');
        }
      } else {
        // Standard and merged campaigns need both types of images
        if (productImages.length > 0 && personImages.length > 0) {
          setModelState('ready');
        } else {
          setModelState('disabled');
        }
      }
    } else if (currentCampaign?.status === 'PENDING' && isCampaignBuilt()) {
      // Campaign is built but waiting for admin approval
      setModelState('pending');
    } else if (currentCampaign?.status === 'REJECTED') {
      // Campaign is rejected
      setModelState('disabled');
    } else {
      // Default case - check if we have enough images based on campaign type
      const campaignType = getCampaignTypeInfo().type;
      
      if (campaignType === 'model') {
        // Model campaigns only need person images
        if (personImages.length > 0) {
          setModelState('ready');
        } else {
          setModelState('disabled');
        }
      } else if (campaignType === 'product') {
        // Product campaigns only need product images
        if (productImages.length > 0) {
          setModelState('ready');
        } else {
          setModelState('disabled');
        }
      } else {
        // Standard and merged campaigns need both types of images
        if (productImages.length > 0 && personImages.length > 0) {
          setModelState('ready');
        } else {
          setModelState('disabled');
        }
      }
    }
  }, [productImages.length, personImages.length, currentCampaign]);

  // Handle building the model - UPDATED to set to pending state
  const handleBuildModel = async () => {
    if (modelState !== 'ready' || !id) return;
    
    if (isPendingCampaign()) {
      setShowPendingError(true);
      return;
    }
    
    // Set to processing state during API call
    // Set to processing state during API call
    setModelState('processing');
    
    try {
      // Call the real API to build the campaign
      await dispatch(buildCampaign(id)).unwrap();
      
      // Set pending state after successful API call - waiting for admin approval
      setModelState('pending');
      showNotification("Campaign submitted for building. It will be available once an administrator approves it.", "success");
      // Set pending state after successful API call - waiting for admin approval
      setModelState('pending');
      showNotification("Campaign submitted for building. It will be available once an administrator approves it.", "success");
      
      // Refresh campaign details to show the pending status
      dispatch(fetchCampaignDetails(id));
      
      // Refresh campaign details to show the pending status
      dispatch(fetchCampaignDetails(id));
      
    } catch (error: any) {
      // Set back to ready state if there was an error
      setModelState('ready');
      showNotification(error?.message || "Failed to build campaign. Please try again.", "error");
    }
  };

  // Handle chat with campaign
  const handleChatWithCampaign = () => {
    if (id) {
      navigate(`/image-generator/${id}`);
    }
  };

  // Current file being reviewed in the upload process
  const currentFileId = `file-${currentFileIndex}`;
  const currentFilePreview = previewUrls[currentFileId];
  const currentFileTitle = imageTitles[currentFileId] || '';
  const currentFileDescription = imageDescriptions[currentFileId] || '';

  // If not authenticated, return null
  if (!isAuthenticated) {
    return null;
  }

  // Render loading state
  if (loading) {
    return (
      <div className={`main-center-content-m-left ${themeSidebarToggle ? "collapsed" : ""}`}>
        <div className="campaign-details-container">
          <div className="campaign-details-loading">
            <div className="spinner"></div>
            <p>Loading campaign details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`main-center-content-m-left ${themeSidebarToggle ? "collapsed" : ""}`}>
        <div className="campaign-details-container">
          <div className="campaign-details-not-found">
            <div className="not-found-icon">
              <i className="fa-solid fa-exclamation-triangle"></i>
            </div>
            <h3>Error Loading Campaign</h3>
            <p>{error}</p>
            <Link to="/campaigns" className="btn btn-primary">Back to Campaigns</Link>
          </div>
        </div>
      </div>
    );
  }

  // Render not found state
  if (!currentCampaign) {
    return (
      <div className={`main-center-content-m-left ${themeSidebarToggle ? "collapsed" : ""}`}>
        <div className="campaign-details-container">
          <div className="campaign-details-not-found">
            <div className="not-found-icon">
              <i className="fa-solid fa-search"></i>
            </div>
            <h3>Campaign Not Found</h3>
            <p>The campaign you are looking for does not exist or has been deleted.</p>
            <Link to="/campaigns" className="btn btn-primary">Back to Campaigns</Link>
          </div>
        </div>
      </div>
    );
  }

  // Get model variables
  const modelName = currentCampaign.model || currentCampaign.model_name || 'General';
  const modelIcon = getModelIcon(modelName);
  const modelClass = getModelClass(modelName);
  const mainImage = currentCampaign.image_url || currentCampaign.image || '';
  const statusInfo = getCampaignStatusInfo();
  const statusInfo = getCampaignStatusInfo();

  return (
    <div className={`main-center-content-m-left ${themeSidebarToggle ? "collapsed" : ""}`}>
      <div className="campaign-details-container">
        {/* Notification toast */}
        {notification.show && (
          <div className={`campaign-details-notification ${notification.type}`}>
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
        
        {/* Campaign Status Banner - NEW */}
        {isPendingCampaign() && (
          <div className="campaign-status-banner pending">
            <i className="fa-solid fa-clock"></i>
            <span>This campaign is awaiting administrator approval. You cannot modify it until it's approved.</span>
          </div>
        )}
        
        {isRejectedCampaign() && (
          <div className="campaign-status-banner rejected">
            <i className="fa-solid fa-times-circle"></i>
            <span>This campaign has been rejected. Please check admin notes for details.</span>
            {/* {currentCampaign.admin_notes && (
              <div className="admin-notes">
                <strong>Admin Notes:</strong> {currentCampaign.admin_notes}
              </div>
            )} */}
          </div>
        )}
        
        {/* Campaign Status Banner - NEW */}
        {isPendingCampaign() && (
          <div className="campaign-status-banner pending">
            <i className="fa-solid fa-clock"></i>
            <span>This campaign is awaiting administrator approval. You cannot modify it until it's approved.</span>
          </div>
        )}
        
        {isRejectedCampaign() && (
          <div className="campaign-status-banner rejected">
            <i className="fa-solid fa-times-circle"></i>
            <span>This campaign has been rejected. Please check admin notes for details.</span>
            {/* {currentCampaign.admin_notes && (
              <div className="admin-notes">
                <strong>Admin Notes:</strong> {currentCampaign.admin_notes}
              </div>
            )} */}
          </div>
        )}
        
        {/* Pending Campaign Error Popup */}
        {showPendingError && (
          <div className="pending-error-modal">
            <div className="modal-overlay" onClick={closePendingErrorPopup}></div>
            <div className="pending-error-content">
              <div className="pending-error-header">
                <i className="fa-solid fa-exclamation-triangle"></i>
                <h3>Campaign Not Verified</h3>
              </div>
              <div className="pending-error-body">
                <p>This campaign is currently in pending status and has not been verified yet. You cannot modify or add images until the campaign is approved.</p>
                <p>Please wait for an administrator to approve this campaign.</p>
              </div>
              <div className="pending-error-footer">
                <button className="btn-ok" onClick={closePendingErrorPopup}>
                  OK, I understand
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Back navigation */}
        <div className="campaign-details-back">
          <Link to="/campaigns" className="back-link">
            <i className="fa-solid fa-arrow-left"></i>
            Back to Campaigns
          </Link>
          
          {/* Status info pills */}
          <div className={`campaign-status-pill ${statusInfo.class}`}>
            <i className={`fa-solid ${statusInfo.icon}`}></i>
            {statusInfo.text}
          </div>
          
          {/* Build Model Button - UPDATED for campaign types */}
          {!isCampaignBuilt() && currentCampaign.status === 'APPROVED' && (
            <button 
              className={`build-model-btn ${modelState}`}
              onClick={handleBuildModel}
              disabled={modelState === 'disabled' || modelState === 'processing' || modelState === 'pending' || isPendingCampaign()}
              disabled={modelState === 'disabled' || modelState === 'processing' || modelState === 'pending' || isPendingCampaign()}
            >
              {modelState === 'disabled' ? (
                <>
                  <i className="fa-solid fa-ban"></i>
                  {getCampaignTypeInfo().type === 'model' ? 'Add Person Images First' :
                   getCampaignTypeInfo().type === 'product' ? 'Add Product Images First' :
                   'Add Both Image Types First'}
                </>
              ) : modelState === 'ready' ? (
                <>
                  <i className="fa-solid fa-cogs"></i>
                  Build Campaign
                </>
              ) : modelState === 'processing' ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  Processing...
                </>
              ) : modelState === 'pending' ? (
                <>
                  <i className="fa-solid fa-clock"></i>
                  Pending Admin Approval
                </>
              ) : modelState === 'pending' ? (
                <>
                  <i className="fa-solid fa-clock"></i>
                  Pending Admin Approval
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check"></i>
                  Built Successfully
                </>
              )}
            </button>
          )}
          
          {/* Pending Build State - NEW */}
          {modelState === 'pending' && !isCampaignBuilt() && (
            <div className="build-status-info pending">
              <i className="fa-solid fa-clock"></i>
              <span>Build requested. Waiting for admin approval.</span>
            </div>
          )}
          
          {/* Chat Button - Only show if campaign is ACTIVE and built */}
          {isCampaignBuilt() && currentCampaign.status === 'ACTIVE' && (
            <button
              className="main-image-chat-button"
              onClick={handleChatWithCampaign}
            >
              <i className="fa-solid fa-comments"></i>
              Chat with Campaign
            </button>
          {/* Pending Build State - NEW */}
          {modelState === 'pending' && !isCampaignBuilt() && (
            <div className="build-status-info pending">
              <i className="fa-solid fa-clock"></i>
              <span>Build requested. Waiting for admin approval.</span>
            </div>
          )}
          
          {/* Chat Button - Only show if campaign is ACTIVE and built */}
          {isCampaignBuilt() && currentCampaign.status === 'ACTIVE' && (
            <button
              className="main-image-chat-button"
              onClick={handleChatWithCampaign}
            >
              <i className="fa-solid fa-comments"></i>
              Chat with Campaign
            </button>
          )}
        </div>
        
        {/* Campaign header */}
        <div className="campaign-details-header">          
          <div className="campaign-details-info">
            {/* Display multiple model tags if available */}
            <div className="campaign-details-models">
              {currentCampaign.selectedModels && currentCampaign.selectedModels.length > 0 ? (
                currentCampaign.selectedModels.map((modelId) => {
                  // Get model display info based on the model ID
                  const modelInfo : any = {
                    "image-generation": {
                      name: "Image Generation",
                      icon: "fa-image",
                      class: "image-generation"
                    },
                    "text-generation": {
                      name: "Text Generation",
                      icon: "fa-font",
                      class: "text-generation" 
                    },
                    "multi-modal": {
                      name: "Multi-modal",
                      icon: "fa-layer-group",
                      class: "multi-modal"
                    }
                  };
                  
                  const model = modelInfo[modelId] || {
                    name: modelId,
                    icon: "fa-robot",
                    class: ""
                  };
                  
                  return (
                    <div key={modelId} className={`campaign-details-model ${model.class}`}>
                      <i className={`fa-solid ${model.icon}`}></i>
                      {model.name}
                    </div>
                  );
                })
              ) : (
                // Fall back to the original single model display
                <div className={`campaign-details-model ${modelClass}`}>
                  <i className={`fa-solid ${modelIcon}`}></i>
                  {modelName}
                </div>
              )}
            </div>
            
            <h1 className="campaign-title">{currentCampaign.name}</h1>
            <p className="campaign-details-description">{currentCampaign.description}</p>
            
            <div className="campaign-details-meta">
              <div className="campaign-details-date">
                <i className="fa-regular fa-calendar"></i>
                Created {formatDate(currentCampaign.created_at || currentCampaign.createdAt || '')}
              </div>
              
              {/* Display admin info if available */}
              {/* {currentCampaign.adminInfo && (
                <div className="campaign-details-admin">
                  <i className="fa-solid fa-user-shield"></i>
                  Reviewed by: {currentCampaign.adminInfo.username}
                </div>
              )} */}
              
              
              {/* Display admin info if available */}
              {/* {currentCampaign.adminInfo && (
                <div className="campaign-details-admin">
                  <i className="fa-solid fa-user-shield"></i>
                  Reviewed by: {currentCampaign.adminInfo.username}
                </div>
              )} */}
              
              {isCampaignBuilt() && (
                <div className="campaign-details-built">
                  <i className="fa-solid fa-lock"></i>
                  Built on {formatDate(currentCampaign.build_date || '')}
                </div>
              )}
            </div>
            
            {/* Admin notes display */}
            {/* {currentCampaign.admin_notes && (
              <div className="campaign-admin-notes">
                <h4><i className="fa-solid fa-clipboard-list"></i> Admin Notes:</h4>
                <p>{currentCampaign.admin_notes}</p>
              </div>
            )} */}
            
            {/* Admin notes display */}
            {/* {currentCampaign.admin_notes && (
              <div className="campaign-admin-notes">
                <h4><i className="fa-solid fa-clipboard-list"></i> Admin Notes:</h4>
                <p>{currentCampaign.admin_notes}</p>
              </div>
            )} */}
          </div>

          <div className="campaign-details-image">
            {mainImage ? (
              <>
                <img src={mainImage} alt={currentCampaign.name} />
                <div className="main-image-badge">Main Image</div>
                
                {/* Add verification overlay if pending */}
                {isPendingCampaign() && (
                  <div className="image-verification-overlay">
                    <i className="fa-solid fa-clock"></i>
                    <span>Awaiting Verification</span>
                  </div>
                )}
                
                {/* Add chat button directly on the image if campaign is built and ACTIVE */}
                {isCampaignBuilt() && currentCampaign.status === 'ACTIVE' && (
                {/* Add verification overlay if pending */}
                {isPendingCampaign() && (
                  <div className="image-verification-overlay">
                    <i className="fa-solid fa-clock"></i>
                    <span>Awaiting Verification</span>
                  </div>
                )}
                
                {/* Add chat button directly on the image if campaign is built and ACTIVE */}
                {isCampaignBuilt() && currentCampaign.status === 'ACTIVE' && (
                  <button 
                    className="main-image-chat-button"
                    onClick={handleChatWithCampaign}
                  >
                    <i className="fa-solid fa-comments"></i>
                    Chat with Campaign
                  </button>
                )}
              </>
            ) : (
              <div className="no-image">
                <i className="fa-regular fa-image"></i>
                <span>No image</span>
              </div>
            )}
          </div>
        </div>

        {/* Campaign content tabs - Conditionally shown based on campaign type */}
        <div className="campaign-details-tabs">
          {/* Always show the campaign type badge */}
          <div className="campaign-type-indicator">
            <i className={`fa-solid ${getCampaignTypeInfo().icon}`}></i>
            {getCampaignTypeInfo().displayName}
          </div>
          
          {/* Only show tabs if campaign is standard or merged type */}
          {(getCampaignTypeInfo().type === 'standard' || getCampaignTypeInfo().type === 'merged') ? (
            <>
              <div 
                className={`tab ${activeTab === 'product' ? 'active' : ''}`}
                onClick={() => setActiveTab('product')}
              >
                Product Images
              </div>
              <div 
                className={`tab ${activeTab === 'person' ? 'active' : ''}`}
                onClick={() => setActiveTab('person')}
              >
                Person Images
              </div>
            </>
          ) : getCampaignTypeInfo().type === 'model' ? (
            // For model campaigns, only show person tab
            <div className="tab active">Person Images</div>
          ) : (
            // For product campaigns, only show product tab
            <div className="tab active">Product Images</div>
          )}
        </div>

        {/* Tab Content - Conditionally shown based on campaign type */}
        <div className="campaign-details-content">
          {/* For model campaigns, only show person tab content */}
          {getCampaignTypeInfo().type === 'model' ? (
            <div className="campaign-images-section">
              <div className="section-header">
                <h2>Person Images</h2>
                <button 
                  className="add-image-btn"
                  onClick={() => {
                    setCurrentImageType('person');
                    openAddImageModal();
                  }}
                  disabled={isCampaignBuilt() || isPendingCampaign()}
                >
                  <i className="fa-solid fa-plus"></i>
                  Add Person Images
                  {isCampaignBuilt() && <span className="locked-tooltip">Campaign is built</span>}
                  {isPendingCampaign() && <span className="locked-tooltip">Campaign needs to be approved first</span>}
                </button>
              </div>

              {personImages.length > 0 ? (
                <div className="campaign-images-gallery">
                  {personImages.map((image) => (
                    <div 
                      key={image.id} 
                      className="gallery-item" 
                      onClick={() => openImageModal(image)}
                    >
                      <img src={image.url} alt={image.title || "Person image"} />
                      <div className="image-overlay">
                        <div className="image-title">
                          {image.title || "Untitled Person"}
                        </div>
                      </div>
                      
                      {/* Lock indicator for built campaigns */}
                      {isCampaignBuilt() && (
                        <div className="image-lock-badge">
                          <i className="fa-solid fa-lock"></i>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-images">
                  <div className="no-images-icon">
                    <i className="fa-regular fa-user"></i>
                  </div>
                  <h3>No Person Images</h3>
                  <p>Add person images for your model campaign.</p>
                  <button 
                    className="add-image-btn" 
                    onClick={() => {
                      setCurrentImageType('person');
                      openAddImageModal();
                    }}
                    disabled={isCampaignBuilt() || isPendingCampaign()}
                  >
                    <i className="fa-solid fa-plus"></i>
                    Add Person Images
                    {isCampaignBuilt() && <span className="locked-tooltip">Campaign is built</span>}
                    {isPendingCampaign() && <span className="locked-tooltip">Campaign needs to be approved first</span>}
                  </button>
                </div>
              )}
              
              {/* Delete Campaign Button at bottom of tab */}
              <div className="campaign-delete-section">
                <button 
                  className="btn-danger" 
                  onClick={handleDeleteCampaign}
                  disabled={isCampaignBuilt() || isPendingCampaign()}
                >
                  <i className="fa-solid fa-trash"></i>
                  Delete Campaign
                  {isCampaignBuilt() && <span className="tooltip-text">Built campaigns cannot be deleted</span>}
                  {isPendingCampaign() && <span className="tooltip-text">Pending campaigns cannot be deleted</span>}
                </button>
              </div>
            </div>
          ) : 
          
          /* For product campaigns, only show product tab content */
          getCampaignTypeInfo().type === 'product' ? (
            <div className="campaign-images-section">
              <div className="section-header">
                <h2>Product Images</h2>
                <button 
                  className="add-image-btn"
                  onClick={() => {
                    setCurrentImageType('product');
                    openAddImageModal();
                  }}
                  disabled={isCampaignBuilt() || isPendingCampaign()}
                >
                  <i className="fa-solid fa-plus"></i>
                  Add Product Images
                  {isCampaignBuilt() && <span className="locked-tooltip">Campaign is built</span>}
                  {isPendingCampaign() && <span className="locked-tooltip">Campaign needs to be approved first</span>}
                </button>
              </div>

              {productImages.length > 0 ? (
                <div className="campaign-images-gallery">
                  {productImages.map((image) => (
                    <div 
                      key={image.id} 
                      className="gallery-item" 
                      onClick={() => openImageModal(image)}
                    >
                      <img src={image.url} alt={image.title || "Product image"} />
                      <div className="image-overlay">
                        <div className="image-title">
                          {image.title || "Untitled Product"}
                        </div>
                      </div>
                      
                      {/* Lock indicator for built campaigns */}
                      {isCampaignBuilt() && (
                        <div className="image-lock-badge">
                          <i className="fa-solid fa-lock"></i>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-images">
                  <div className="no-images-icon">
                    <i className="fa-regular fa-images"></i>
                  </div>
                  <h3>No Product Images</h3>
                  <p>Add product images to showcase in your campaign.</p>
                  <button 
                    className="add-image-btn" 
                    onClick={() => {
                      setCurrentImageType('product');
                      openAddImageModal();
                    }}
                    disabled={isCampaignBuilt() || isPendingCampaign()}
                  >
                    <i className="fa-solid fa-plus"></i>
                    Add Product Images
                    {isCampaignBuilt() && <span className="locked-tooltip">Campaign is built</span>}
                    {isPendingCampaign() && <span className="locked-tooltip">Campaign needs to be approved first</span>}
                  </button>
                </div>
              )}
              
              {/* Delete Campaign Button at bottom of tab */}
              <div className="campaign-delete-section">
                <button 
                  className="btn-danger" 
                  onClick={handleDeleteCampaign}
                  disabled={isCampaignBuilt() || isPendingCampaign()}
                >
                  <i className="fa-solid fa-trash"></i>
                  Delete Campaign
                  {isCampaignBuilt() && <span className="tooltip-text">Built campaigns cannot be deleted</span>}
                  {isPendingCampaign() && <span className="tooltip-text">Pending campaigns cannot be deleted</span>}
                </button>
              </div>
            </div>
          ) :
          
          /* For standard or merged campaigns, show content based on active tab */
          (
            <>
              {/* Product Images Tab */}
              {activeTab === 'product' && (
                <div className="campaign-images-section">
                  <div className="section-header">
                    <h2>Product Images</h2>
                    <button 
                      className="add-image-btn"
                      onClick={() => {
                        setCurrentImageType('product');
                        openAddImageModal();
                      }}
                      disabled={isCampaignBuilt() || isPendingCampaign()}
                    >
                      <i className="fa-solid fa-plus"></i>
                      Add Product Images
                      {isCampaignBuilt() && <span className="locked-tooltip">Campaign is built</span>}
                      {isPendingCampaign() && <span className="locked-tooltip">Campaign needs to be approved first</span>}
                    </button>
                  </div>

                  {productImages.length > 0 ? (
                    <div className="campaign-images-gallery">
                      {productImages.map((image) => (
                        <div 
                          key={image.id} 
                          className="gallery-item" 
                          onClick={() => openImageModal(image)}
                        >
                          <img src={image.url} alt={image.title || "Product image"} />
                          <div className="image-overlay">
                            <div className="image-title">
                              {image.title || "Untitled Product"}
                            </div>
                          </div>
                          
                          {/* Lock indicator for built campaigns */}
                          {isCampaignBuilt() && (
                            <div className="image-lock-badge">
                              <i className="fa-solid fa-lock"></i>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-images">
                      <div className="no-images-icon">
                        <i className="fa-regular fa-images"></i>
                      </div>
                      <h3>No Product Images</h3>
                      <p>Add product images to showcase in your campaign.</p>
                      <button 
                        className="add-image-btn" 
                        onClick={() => {
                          setCurrentImageType('product');
                          openAddImageModal();
                        }}
                        disabled={isCampaignBuilt() || isPendingCampaign()}
                      >
                        <i className="fa-solid fa-plus"></i>
                        Add Product Images
                        {isCampaignBuilt() && <span className="locked-tooltip">Campaign is built</span>}
                        {isPendingCampaign() && <span className="locked-tooltip">Campaign needs to be approved first</span>}
                      </button>
                    </div>
                  )}
                  
                  {/* Delete Campaign Button at bottom of tab */}
                  <div className="campaign-delete-section">
                    <button 
                      className="btn-danger" 
                      onClick={handleDeleteCampaign}
                      disabled={isCampaignBuilt() || isPendingCampaign()}
                    >
                      <i className="fa-solid fa-trash"></i>
                      Delete Campaign
                      {isCampaignBuilt() && <span className="tooltip-text">Built campaigns cannot be deleted</span>}
                      {isPendingCampaign() && <span className="tooltip-text">Pending campaigns cannot be deleted</span>}
                    </button>
                  </div>
                </div>
              )}

              {/* Person Images Tab */}
              {activeTab === 'person' && (
                <div className="campaign-images-section">
                  <div className="section-header">
                    <h2>Person Images</h2>
                    <button 
                      className="add-image-btn"
                      onClick={() => {
                        setCurrentImageType('person');
                        openAddImageModal();
                      }}
                      disabled={isCampaignBuilt() || isPendingCampaign()}
                    >
                      <i className="fa-solid fa-plus"></i>
                      Add Person Images
                      {isCampaignBuilt() && <span className="locked-tooltip">Campaign is built</span>}
                      {isPendingCampaign() && <span className="locked-tooltip">Campaign needs to be approved first</span>}
                    </button>
                  </div>

                  {personImages.length > 0 ? (
                    <div className="campaign-images-gallery">
                      {personImages.map((image) => (
                        <div 
                          key={image.id} 
                          className="gallery-item" 
                          onClick={() => openImageModal(image)}
                        >
                          <img src={image.url} alt={image.title || "Person image"} />
                          <div className="image-overlay">
                            <div className="image-title">
                              {image.title || "Untitled Person"}
                            </div>
                          </div>
                          
                          {/* Lock indicator for built campaigns */}
                          {isCampaignBuilt() && (
                            <div className="image-lock-badge">
                              <i className="fa-solid fa-lock"></i>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-images">
                      <div className="no-images-icon">
                        <i className="fa-regular fa-user"></i>
                      </div>
                      <h3>No Person Images</h3>
                      <p>Add person images for your campaign.</p>
                      <button 
                        className="add-image-btn" 
                        onClick={() => {
                          setCurrentImageType('person');
                          openAddImageModal();
                        }}
                        disabled={isCampaignBuilt() || isPendingCampaign()}
                      >
                        <i className="fa-solid fa-plus"></i>
                        Add Person Images
                        {isCampaignBuilt() && <span className="locked-tooltip">Campaign is built</span>}
                        {isPendingCampaign() && <span className="locked-tooltip">Campaign needs to be approved first</span>}
                      </button>
                    </div>
                  )}
                  
                  {/* Delete Campaign Button at bottom of tab */}
                  <div className="campaign-delete-section">
                    <button 
                      className="btn-danger" 
                      onClick={handleDeleteCampaign}
                      disabled={isCampaignBuilt() || isPendingCampaign()}
                    >
                      <i className="fa-solid fa-trash"></i>
                      Delete Campaign
                      {isCampaignBuilt() && <span className="tooltip-text">Built campaigns cannot be deleted</span>}
                      {isPendingCampaign() && <span className="tooltip-text">Pending campaigns cannot be deleted</span>}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Image View/Edit Modal */}
        {isImageModalOpen && selectedImage && (
          <div className="image-details-modal">
            <div className="modal-overlay" onClick={closeImageModal}></div>
            <div className="modal-content">
              <button className="modal-close" onClick={closeImageModal}>
                <i className="fa-solid fa-xmark"></i>
              </button>
              
              <div className="image-details">
                <div className="image-viewer">
                  <img src={selectedImage.url} alt={selectedImage.title || "Campaign image"} />
                </div>
                
                <div className="image-info">
                  {editingImage ? (
                    <>
                      <h3>Edit Image Details</h3>
                      
                      <div className="form-group">
                        <label htmlFor="image-title">Image Title</label>
                        <input
                          id="image-title"
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Enter image title"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="image-description">Image Description</label>
                        <textarea
                          id="image-description"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Enter image description"
                          rows={4}
                        />
                      </div>
                      
                      <div className="image-actions">
                        <button 
                          className="btn-cancel" 
                          onClick={() => setEditingImage(null)}
                        >
                          Cancel
                        </button>
                        <button 
                          className="btn-save"
                          onClick={saveImageEdits}
                        >
                          Save Changes
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3>{selectedImage.title || "Untitled Image"}</h3>
                      <div className="image-date">
                        <i className="fa-regular fa-calendar"></i>
                        Added: {formatDate(selectedImage.created_at)}
                      </div>
                      <div className="image-description">
                        {selectedImage.description || "No description provided."}
                      </div>
                      <div className="image-actions">
                        <button 
                          className="btn-edit" 
                          onClick={() => startEditingImage(selectedImage)}
                          disabled={isCampaignBuilt() || isPendingCampaign()}
                        >
                          <i className="fa-solid fa-pen"></i>
                          Edit Details
                          {isCampaignBuilt() && <span className="tooltip-text">Campaign is built and locked</span>}
                          {isPendingCampaign() && <span className="tooltip-text">Campaign needs to be approved first</span>}
                        </button>
                        <button 
                          className="btn-delete-image"
                          onClick={() => handleDeleteImage(selectedImage.id)}
                          disabled={isCampaignBuilt() || isPendingCampaign()}
                        >
                          <i className="fa-solid fa-trash"></i>
                          Delete Image
                          {isCampaignBuilt() && <span className="tooltip-text">Campaign is built and locked</span>}
                          {isPendingCampaign() && <span className="tooltip-text">Campaign needs to be approved first</span>}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Multiple Images Modal */}
        {isAddImageModalOpen && (
          <div className="image-details-modal">
            <div className="modal-overlay" onClick={closeAddImageModal}></div>
            <div className="modal-content">
              <button className="modal-close" onClick={closeAddImageModal}>
                <i className="fa-solid fa-xmark"></i>
              </button>
              
              <h3 className="modal-title">Add {currentImageType === 'product' ? 'Product' : 'Person'} {selectedFiles.length > 0 ? `Image ${currentFileIndex + 1}/${selectedFiles.length}` : 'Images'}</h3>
              
              <div className="add-images-container">
                {selectedFiles.length === 0 ? (
                  // File upload stage
                  <div className="file-upload-stage">
                    <div 
                      className="upload-dropzone"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <i className="fa-solid fa-cloud-upload-alt"></i>
                      <h4>Select Multiple Images</h4>
                      <p>Click to browse or drag & drop</p>
                    </div>
                    
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      onChange={handleFilesChange}
                      style={{ display: 'none' }}
                      ref={fileInputRef}
                    />
                  </div>
                ) : (
                  // Image review stage
                  <div className="image-review-stage">
                    <div className="review-header">
                      <h4>Review Images ({currentFileIndex + 1}/{selectedFiles.length})</h4>
                    </div>
                    
                    <div className="review-content">
                      <div className="review-image-preview">
                        <img src={currentFilePreview} alt="Preview" />
                      </div>
                      
                      <div className="review-form">
                        <div className="form-group">
                          <label htmlFor="image-title">Image Title</label>
                          <input
                            id="image-title"
                            type="text"
                            value={currentFileTitle}
                            onChange={(e) => setImageTitles(prev => ({
                              ...prev,
                              [currentFileId]: e.target.value
                            }))}
                            placeholder={`Enter ${currentImageType} image title`}
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="image-description">
                            Description
                            <button 
                              className="ai-generate-btn"
                              onClick={() => generateAIDescription(currentFileIndex)}
                              type="button"
                            >
                              <i className="fa-solid fa-robot"></i>
                              Generate with Gemini
                            </button>
                          </label>
                          <textarea
                            id="image-description"
                            value={currentFileDescription}
                            onChange={(e) => setImageDescriptions(prev => ({
                              ...prev,
                              [currentFileId]: e.target.value
                            }))}
                            placeholder={`Describe this ${currentImageType} image`}
                            rows={4}
                          ></textarea>
                        </div>
                      </div>
                    </div>
                    
                    <div className="review-navigation">
                      <button 
                        className="nav-btn prev"
                        onClick={goToPrevImage}
                        disabled={currentFileIndex === 0}
                      >
                        <i className="fa-solid fa-arrow-left"></i>
                        Previous
                      </button>
                      
                      {currentFileIndex < selectedFiles.length - 1 ? (
                        <button 
                          className="nav-btn next"
                          onClick={goToNextImage}
                        >
                          Next
                          <i className="fa-solid fa-arrow-right"></i>
                        </button>
                      ) : (
                        <button 
                          className="nav-btn finish"
                          onClick={handleAddImages}
                        >
                          Finish
                          <i className="fa-solid fa-check"></i>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDetails;