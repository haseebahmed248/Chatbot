import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

// Import images
import avatar03 from "assets/images/avatar/03.png";
import avatar04 from "assets/images/avatar/04.png";
import icon15 from "assets/images/avatar/01.png";
import useSidebarToggle from "Common/UseSideberToggleHooks";

// Import Redux actions
import { 
  setUploadedImage, 
  clearUploadedImage 
} from "Slices/chat/conversationSlice";
import { AppDispatch, RootState } from "Slices/theme/store";
import { fetchCampaigns, fetchCampaignDetails } from "Slices/CampaignsSlice";
import AuthModal from "Common/AuthModal";

// Sample image URLs for hardcoded response (using valid image URLs)
const sampleImageUrls = [
  "https://picsum.photos/id/1/500/500",
  "https://picsum.photos/id/20/500/500",
  "https://picsum.photos/id/36/500/500",
  "https://picsum.photos/id/42/500/500"
];

const ImageGenerator = () => {
    // Get campaign ID from URL params
    const { id: campaignIdParam } = useParams<{ id?: string }>();
    
    // Router
    const navigate = useNavigate();
    
    // Redux hooks
    const dispatch = useDispatch<AppDispatch>();
    const { 
      isLoading, 
      uploadedImage 
    } = useSelector((state: RootState) => state.conversation);
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const { campaigns, loading: campaignsLoading, currentCampaign } = useSelector((state: RootState) => state.campaigns);
    const themeType = useSelector((state: RootState) => state.theme.themeType);
    
    // Local state
    const [userInput, setUserInput] = useState("");
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
    const [showCampaignSelector, setShowCampaignSelector] = useState(false);
    const [imageCount, setImageCount] = useState(4); // Default to 4 images
    const [showImageCountDropdown, setShowImageCountDropdown] = useState(false);
    const [campaignDetailsLoading, setCampaignDetailsLoading] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Local state for conversations
    const [conversations, setConversations] = useState<any[]>([]);
    
    const themeSidebarToggle = useSidebarToggle();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const campaignSelectorRef = useRef<HTMLDivElement>(null);
    const imageCountDropdownRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const isDarkMode = themeType === 'dark';
    
    // Add body class
    useEffect(() => {
        document.body.classList.add("chatbot");
        return () => {
            document.body.classList.remove("chatbot");
        };
    }, []);

    // Fetch campaigns and specific campaign details if ID is provided
    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchCampaigns());
            
            // If campaign ID is in URL, fetch its details and select it
            if (campaignIdParam) {
                setCampaignDetailsLoading(true);
                dispatch(fetchCampaignDetails(campaignIdParam))
                  .unwrap()
                  .then(() => {
                      setSelectedCampaign(campaignIdParam);
                      setCampaignDetailsLoading(false);
                  })
                  .catch(() => {
                      setCampaignDetailsLoading(false);
                  });
            }
        }
    }, [isAuthenticated, dispatch, campaignIdParam]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (campaignSelectorRef.current && !campaignSelectorRef.current.contains(event.target as Node)) {
                setShowCampaignSelector(false);
            }
            if (imageCountDropdownRef.current && !imageCountDropdownRef.current.contains(event.target as Node)) {
                setShowImageCountDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Scroll to bottom when conversations change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversations]);

    // Navigate to campaigns page
    const goToCampaignsPage = () => {
        navigate('/campaigns');
    };

    // Handle campaign selection
    const handleCampaignSelect = (campaignId: string) => {
        setSelectedCampaign(campaignId);
        setShowCampaignSelector(false);
    };

    // Toggle campaign selector
    const toggleCampaignSelector = () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }
        setShowCampaignSelector(!showCampaignSelector);
    };

    // Handle image count selection
    const handleImageCountSelect = (count: number) => {
        setImageCount(count);
        setShowImageCountDropdown(false);
    };

    // Toggle image count dropdown
    const toggleImageCountDropdown = () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }
        
        if (!selectedCampaign) {
            alert("Please select a campaign first");
            return;
        }
        
        setShowImageCountDropdown(!showImageCountDropdown);
        
        // When opening the dropdown, ensure it's visible by scrolling if needed
        if (!showImageCountDropdown) {
            setTimeout(() => {
                if (imageCountDropdownRef.current) {
                    const rect = imageCountDropdownRef.current.getBoundingClientRect();
                    if (rect.top < 0) {
                        window.scrollBy({
                            top: rect.top - 10,
                            behavior: 'smooth'
                        });
                    }
                }
            }, 50);
        }
    };

    // Get selected campaign name
    const getSelectedCampaignName = () => {
        if (!selectedCampaign) return "Select campaign";
        const campaign = campaigns.find(c => c.id.toString() === selectedCampaign);
        return campaign ? campaign.name : "Select campaign";
    };

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        if (!selectedCampaign) {
            alert("Please select a campaign first");
            return;
        }

        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                dispatch(setUploadedImage({
                    file: file,
                    preview: event.target?.result as string
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle image upload button click
    const handleUploadClick = () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        if (!selectedCampaign) {
            alert("Please select a campaign first");
            return;
        }

        fileInputRef.current?.click();
    };

    // Remove uploaded image
    const removeUploadedImage = () => {
        dispatch(clearUploadedImage());
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    // Open image review modal
    const openReviewModal = (imageUrl: string) => {
        setSelectedImage(imageUrl);
        setReviewModalOpen(true);
    };
    
    // Close image review modal
    const closeReviewModal = () => {
        setReviewModalOpen(false);
        setSelectedImage(null);
    };
    
    // Handle social media download
    const handleSocialDownload = (platform: string) => {
        // This would normally make an API call to prepare the image for the platform
        // For now, we'll just show an alert
        alert(`Image prepared for ${platform}! Download started.`);
    };
    
    // Handle direct download
    const handleDownload = () => {
        if (selectedImage) {
            // In a real implementation, this would trigger a proper download
            // For this demo, we'll open the image in a new tab
            window.open(selectedImage, '_blank');
        }
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() && !uploadedImage) return;
        
        // Check if user is authenticated
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }
        
        // Check if campaign is selected
        if (!selectedCampaign) {
            alert("Please select a campaign first");
            return;
        }
        
        // Add user message to conversations
        const userMessage = {
            type: 'user',
            content: userInput,
            image: uploadedImage ? uploadedImage.preview : null
        };
        
        setConversations([...conversations, userMessage]);
        
        // Scroll to bottom immediately after adding user message
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
        // Set loading state
        setLoading(true);
        
        // Simulate API delay then add hardcoded response
        setTimeout(() => {
            // Create AI response with hardcoded images
            const aiResponse = {
                type: 'ai',
                content: "Here are your generated images based on your prompt.",
                prompt: userInput,
                images: sampleImageUrls.slice(0, imageCount).map((url, idx) => ({
                    url,
                    id: `img-${Date.now()}-${idx}`
                }))
            };
            
            // Add AI response to conversations
            setConversations(prevConversations => [...prevConversations, aiResponse]);
            
            // Turn off loading state
            setLoading(false);
            
            // Scroll to bottom after adding AI response
            setTimeout(() => {
                bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }, 1500);
        
        // Clear input field but keep the image if one was uploaded
        setUserInput("");
    };

    // Close auth modal
    const closeAuthModal = () => {
        setShowAuthModal(false);
    };

    // Render a conversation message
    const renderConversation = (item: any, index: number) => {
        if (item.type === 'user') {
            return (
                <div className="message-item user-message" key={index}>
                    <div className="message-avatar">
                        <img src={avatar03} alt="User" />
                    </div>
                    <div className="message-content">
                        <div className="message-text">
                            {item.content}
                        </div>
                        {item.image && (
                            <div className="message-image">
                                <img src={item.image} alt="Uploaded" />
                            </div>
                        )}
                    </div>
                </div>
            );
        } else {
            return (
                <div className="message-item ai-message" key={index}>
                    <div className="message-avatar">
                        <img src={avatar04} alt="AI" />
                    </div>
                    <div className="message-content">
                        <div className="message-header">
                            <span className="message-sender">AdGenie</span>
                        </div>
                        {item.content && (
                            <div className="message-text">
                                {item.content}
                            </div>
                        )}
                        {item.images && item.images.length > 0 && (
                            <div className="message-generated-images">
                                <div className="image-grid">
                                    {item.images.map((image: any, idx: number) => (
                                        <div 
                                            className="image-item"
                                            key={idx}
                                            onClick={() => openReviewModal(image.url)}
                                        >
                                            <img src={image.url} alt={`Generated ${idx + 1}`} />
                                            <div className="image-overlay">
                                                <button className="review-btn">
                                                    <i className="fa-solid fa-eye"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="image-caption">
                                    <p>"{item.prompt || 'Generated image'}"</p>
                                </div>
                                <div className="image-actions">
                                    <div className="powered-by">
                                        <img src={icon15} alt="AdGenie Logo" />
                                        <span>Powered by AdGenie</span>
                                    </div>
                                    <div className="action-buttons">
                                        <button className="action-btn" title="Save">
                                            <i className="fa-regular fa-bookmark"></i>
                                        </button>
                                        <button className="action-btn" title="Like">
                                            <i className="fa-light fa-thumbs-up"></i>
                                        </button>
                                        <button className="action-btn" title="Dislike">
                                            <i className="fa-regular fa-thumbs-down"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }
    };

    // Render campaign selector dropdown
    const renderCampaignDropdown = () => {
        return (
            <div className="campaign-selector" ref={campaignSelectorRef}>
                <div 
                    className="selector-header"
                    onClick={toggleCampaignSelector}
                >
                    <span>{getSelectedCampaignName()}</span>
                    <i className={`fa-solid fa-chevron-${showCampaignSelector ? 'up' : 'down'}`}></i>
                </div>
                
                {showCampaignSelector && (
                    <div className="selector-dropdown">
                        {campaignsLoading ? (
                            <div className="dropdown-item loading">
                                <i className="fa-solid fa-spinner fa-spin"></i>
                                <span>Loading campaigns...</span>
                            </div>
                        ) : campaigns.length === 0 ? (
                            <div className="dropdown-item create-new" onClick={goToCampaignsPage}>
                                <i className="fa-solid fa-plus"></i>
                                <span>Create first campaign</span>
                            </div>
                        ) : (
                            <>
                                {campaigns.map(campaign => (
                                    <div 
                                        key={campaign.id} 
                                        className={`dropdown-item ${selectedCampaign === campaign.id.toString() ? 'selected' : ''}`}
                                        onClick={() => handleCampaignSelect(campaign.id.toString())}
                                    >
                                        {campaign.name}
                                    </div>
                                ))}
                                <div className="dropdown-item create-new" onClick={goToCampaignsPage}>
                                    <i className="fa-solid fa-plus"></i>
                                    <span>Add New Campaign</span>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Render image count dropdown
    const renderImageCountDropdown = () => {
        return (
            <div className="image-count-selector" ref={imageCountDropdownRef}>
                <div 
                    className="selector-header"
                    onClick={toggleImageCountDropdown}
                >
                    <span>{imageCount} {imageCount === 1 ? 'image' : 'images'}</span>
                    <i className={`fa-solid fa-chevron-${showImageCountDropdown ? 'up' : 'down'}`}></i>
                </div>
                
                {showImageCountDropdown && (
                    <div className="selector-dropdown">
                        {[1, 2, 3, 4].map(count => (
                            <div 
                                key={count} 
                                className={`dropdown-item ${imageCount === count ? 'selected' : ''}`}
                                onClick={() => handleImageCountSelect(count)}
                            >
                                {count} {count === 1 ? 'image' : 'images'}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Render campaign details header
    const renderCampaignDetailsHeader = () => {
        if (!currentCampaign || campaignDetailsLoading) {
            return (
                <div className="campaign-header skeleton">
                    <div className="campaign-image skeleton-image"></div>
                    <div className="campaign-info">
                        <div className="campaign-title skeleton-text"></div>
                        <div className="campaign-description skeleton-text"></div>
                    </div>
                </div>
            );
        }
        
        if (!campaignIdParam) return null;
        
        const mainImage = currentCampaign.image_url || currentCampaign.image || '';
        
        return (
            <div className="campaign-header">
                <div className="campaign-image">
                    {mainImage ? (
                        <img src={mainImage} alt={currentCampaign.name} />
                    ) : (
                        <div className="campaign-image-placeholder">
                            <i className="fa-solid fa-image"></i>
                        </div>
                    )}
                </div>
                <div className="campaign-info">
                    <h2 className="campaign-title">{currentCampaign.name}</h2>
                    <p className="campaign-description">{currentCampaign.description}</p>
                </div>
            </div>
        );
    };
    
    // Render Image Review Modal
    const renderReviewModal = () => {
        if (!reviewModalOpen || !selectedImage) return null;
        
        return (
            <div className="review-modal-overlay">
                <div className="review-modal">
                    <button className="close-modal" onClick={closeReviewModal}>
                        <i className="fa-solid fa-times"></i>
                    </button>
                    
                    <div className="review-image-container">
                        <img src={selectedImage} alt="Preview" />
                    </div>
                    
                    <div className="review-actions">
                        <div className="review-title">
                            <h3>Image Preview</h3>
                        </div>
                        
                        <div className="review-download-options">
                            <button 
                                className="download-btn instagram"
                                onClick={() => handleSocialDownload('Instagram')}
                                title="Download for Instagram"
                            >
                                <i className="fa-brands fa-instagram"></i>
                                <span>Instagram</span>
                            </button>
                            
                            <button 
                                className="download-btn twitter"
                                onClick={() => handleSocialDownload('Twitter')}
                                title="Download for Twitter"
                            >
                                <i className="fa-brands fa-twitter"></i>
                                <span>Twitter</span>
                            </button>
                            
                            <button 
                                className="download-btn download"
                                onClick={handleDownload}
                                title="Download Image"
                            >
                                <i className="fa-solid fa-download"></i>
                                <span>Download</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`main-content-area ${themeSidebarToggle ? "sidebar-collapsed" : ""}`}>
            {/* Header area - always visible */}
            <div className="generator-header">
                <div className="header-content">
                    {campaignIdParam ? renderCampaignDetailsHeader() : (
                        <div className="campaign-selection">
                            <h2 className="section-title">Image Generator</h2>
                            {isAuthenticated && renderCampaignDropdown()}
                        </div>
                    )}
                </div>
            </div>

            {/* Main content area */}
            <div className="generator-content">
                {/* Messages container */}
                <div className="messages-container">
                    {!isAuthenticated ? (
                        <div className="auth-required">
                            <div className="auth-message">
                                <i className="fa-solid fa-lock"></i>
                                <h3>Sign In Required</h3>
                                <p>Please sign in to start using the image generator</p>
                                <button 
                                    className="btn-primary"
                                    onClick={() => setShowAuthModal(true)}
                                >
                                    Sign In
                                </button>
                            </div>
                        </div>
                    ) : conversations.length > 0 ? (
                        <div className="messages-list">
                            {conversations.map(renderConversation)}
                            {loading && (
                                <div className="loading-indicator">
                                    <div className="loading-spinner"></div>
                                    <span>Generating images...</span>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-illustration">
                                <i className="fa-solid fa-image fa-2x"></i>
                            </div>
                            <h3>Start Creating Images</h3>
                            <p>Type a message or upload an image to get started</p>
                        </div>
                    )}
                </div>

                {/* Input area - fixed at bottom */}
                <div className="input-area">
                    <div className="input-container">
                        <form onSubmit={handleSubmit} className={!isAuthenticated ? 'disabled' : ''}>
                            {/* Hidden file input */}
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                            
                            {/* Display uploaded image preview */}
                            {uploadedImage && (
                                <div className="uploaded-preview">
                                    <img src={uploadedImage.preview} alt="Upload preview" />
                                    <button 
                                        type="button" 
                                        className="remove-upload" 
                                        onClick={removeUploadedImage}
                                        aria-label="Remove image"
                                    >
                                        <i className="fa-solid fa-times"></i>
                                    </button>
                                </div>
                            )}
                            
                            <div className="input-controls">
                                {/* Image count selector */}
                                {isAuthenticated && selectedCampaign && (
                                    <div className="input-options">
                                        {renderImageCountDropdown()}
                                    </div>
                                )}

                                {/* Main input field */}
                                <div className="input-field">
                                    <input 
                                        type="text" 
                                        placeholder={isAuthenticated ? 
                                            (selectedCampaign ? "Describe the image you want to generate..." : "Select a campaign first") 
                                            : "Sign in to start"
                                        }
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        disabled={!isAuthenticated || !selectedCampaign}
                                    />
                                </div>

                                {/* Action buttons */}
                                <div className="input-actions">
                                    <button
                                        type="button"
                                        className="action-btn upload-btn"
                                        onClick={handleUploadClick}
                                        disabled={!isAuthenticated || !selectedCampaign}
                                        aria-label="Upload an image"
                                    >
                                        <i className="fa-solid fa-image"></i>
                                    </button>
                                    
                                    <button 
                                        type="submit"
                                        className="action-btn submit-btn"
                                        disabled={!isAuthenticated || !selectedCampaign || (!userInput.trim() && !uploadedImage)}
                                        aria-label="Send"
                                    >
                                        <i className="fa-solid fa-arrow-up"></i>
                                    </button>
                                </div>
                            </div>
                        </form>
                        
                        {/* Copyright footer - inside input container for better UX */}
                        <div className="generator-footer">
                            <p>© <Link to="#">AdGenie</Link> 2025. All Rights Reserved.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Review Modal */}
            {renderReviewModal()}

            {/* Authentication Modal */}
            <AuthModal 
                isOpen={showAuthModal} 
                onClose={closeAuthModal} 
                isDarkMode={isDarkMode}
            />
        </div>
    );
};

export default ImageGenerator;