import React, { useState } from 'react';
import { CampaignImage } from 'Slices/CampaignsSlice'; 

interface ImageGalleryProps {
  images: CampaignImage[];
  onDelete: (imageId: string) => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onDelete }) => {
  const [selectedImage, setSelectedImage] = useState<CampaignImage | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  
  const handleImageClick = (image: CampaignImage) => {
    setSelectedImage(image);
    setShowDeleteConfirm(false);
  };
  
  const closeDetails = () => {
    setSelectedImage(null);
    setShowDeleteConfirm(false);
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="image-gallery">
      {/* Gallery grid */}
      <div className="image-grid">
        {images.map(image => (
          <div 
            key={image.id} 
            className="image-item"
            onClick={() => handleImageClick(image)}
          >
            <div className="image-preview" style={{ backgroundImage: `url(${image.url})` }}>
              <div className="image-overlay">
                <div className="image-title">{image.title || 'Untitled'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Image details modal */}
      {selectedImage && (
        <div className="image-details-modal">
          <div className="modal-overlay" onClick={closeDetails}></div>
          <div className="modal-content">
            <button className="modal-close" onClick={closeDetails}>
              <i className="fa-solid fa-times"></i>
            </button>
            
            <div className="image-details">
              <div className="image-viewer">
                <img src={selectedImage.url} alt={selectedImage.title} />
              </div>
              
              <div className="image-info">
                <h3>{selectedImage.title || 'Untitled'}</h3>
                <p className="image-date">Added: {formatDate(selectedImage.created_at)}</p>
                <div className="image-description">
                  {selectedImage.description || 'No description provided for this image.'}
                </div>
                
                <div className="image-actions">
                  {showDeleteConfirm ? (
                    <div className="delete-confirm">
                      <p>Are you sure you want to delete this image?</p>
                      <div className="confirm-buttons">
                        <button 
                          className="btn-cancel" 
                          onClick={() => setShowDeleteConfirm(false)}
                        >
                          Cancel
                        </button>
                        <button 
                          className="btn-delete" 
                          onClick={() => {
                            onDelete(selectedImage.id);
                            closeDetails();
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      className="btn-delete-image" 
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <i className="fa-regular fa-trash-alt"></i>
                      Delete Image
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;