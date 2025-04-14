import React, { useRef, useEffect } from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDarkMode: boolean;
  campaignName: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDarkMode,
  campaignName
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className="delete-modal-overlay">
      <div 
        ref={modalRef}
        className={`delete-modal ${isDarkMode ? 'dark-theme' : 'light-theme'}`}
      >
        <div className="delete-modal-header">
          <h3>Delete Campaign</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        
        <div className="delete-modal-body">
          <div className="delete-warning-icon">
            <i className="fa-solid fa-exclamation-triangle"></i>
          </div>
          
          <p className="delete-warning-message">
            Are you sure you want to delete <strong>"{campaignName}"</strong>?
          </p>
          
          <p className="delete-warning-description">
            This action cannot be undone. All data associated with this campaign will be permanently removed.
          </p>
        </div>
        
        <div className="delete-modal-footer">
          <button 
            type="button" 
            className="rts-btn btn-secondary" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="rts-btn btn-danger" 
            onClick={onConfirm}
          >
            Delete Campaign
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;