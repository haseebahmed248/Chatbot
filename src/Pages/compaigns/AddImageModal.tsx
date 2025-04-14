import React, { useState, useRef } from 'react';

interface AddImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageData: { image: File; description: string; title: string }) => void;
  isDarkMode: boolean;
}

const AddImageModal: React.FC<AddImageModalProps> = ({ isOpen, onClose, onSave, isDarkMode }) => {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImageChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    
    setImage(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageChange(e.dataTransfer.files);
    }
  };
  
  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImage(null);
    setImagePreview('');
    setTitle('');
    setDescription('');
  };
  
  const handleSave = () => {
    if (!image) {
      alert('Please select an image.');
      return;
    }
    
    onSave({
      image,
      title: title.trim() || 'Untitled Image',
      description: description.trim() || ''
    });
  };
  
  if (!isOpen) return null;
  
  // Simple UI without nested event handlers
  return (
    <div className="modal-wrapper" style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Semi-transparent backdrop */}
      <div 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0, 0, 0, 0.5)' 
        }} 
        onClick={onClose}
      ></div>
      
      {/* Modal content - with stopPropagation */}
      <div 
        style={{ 
          position: 'relative', 
          backgroundColor: isDarkMode ? '#1a1a1a' : 'white', 
          color: isDarkMode ? 'white' : 'black',
          borderRadius: '8px', 
          width: '600px', 
          maxWidth: '90%', 
          maxHeight: '90vh', 
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          zIndex: 10000
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '1.25rem 1.5rem', 
          borderBottom: isDarkMode ? '1px solid #333' : '1px solid #e5e7eb'
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 500, 
            margin: 0,
            color: isDarkMode ? '#f3f4f6' : '#111827'
          }}>
            Add Image
          </h2>
          <button 
            style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              background: 'none', 
              border: 'none', 
              color: isDarkMode ? '#9ca3af' : '#6b7280', 
              fontSize: '1.25rem', 
              cursor: 'pointer',
              borderRadius: '50%',
              transition: 'background-color 0.2s, color 0.2s'
            }} 
            onClick={onClose}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        
        {/* Modal body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: 'calc(90vh - 130px)' }}>
          {/* Image upload area */}
          <div 
            style={{ 
              width: '100%', 
              minHeight: '200px', 
              border: `2px dashed ${dragActive ? (isDarkMode ? '#6366f1' : '#4f46e5') : (isDarkMode ? '#4b5563' : '#d1d5db')}`, 
              borderRadius: '8px', 
              marginBottom: '1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              backgroundColor: dragActive ? (isDarkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(79, 70, 229, 0.1)') : 'transparent'
            }}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            {imagePreview ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{ 
                    width: '100%', 
                    height: 'auto', 
                    maxHeight: '300px', 
                    objectFit: 'contain', 
                    display: 'block' 
                  }} 
                />
                <button 
                  style={{ 
                    position: 'absolute', 
                    top: '0.5rem', 
                    right: '0.5rem', 
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
                    color: 'white', 
                    border: 'none', 
                    width: '30px', 
                    height: '30px', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    cursor: 'pointer' 
                  }} 
                  onClick={handleReset}
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '3rem', color: '#666', marginBottom: '1rem' }}>
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                </div>
                <p style={{ marginBottom: '1rem', color: '#888' }}>Drag & Drop an image or click to browse</p>
                <button 
                  style={{ 
                    backgroundColor: isDarkMode ? '#6366f1' : '#4f46e5', 
                    color: 'white', 
                    border: 'none', 
                    padding: '0.6rem 1.2rem', 
                    borderRadius: '4px', 
                    cursor: 'pointer', 
                    fontWeight: 500,
                    transition: 'background-color 0.2s'
                  }} 
                  onClick={() => fileInputRef.current?.click()}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#4f46e5' : '#4338ca'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#6366f1' : '#4f46e5'}
                >
                  Browse Files
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files)}
                />
              </div>
            )}
          </div>
          
          {/* Image details form */}
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label 
                htmlFor="image-title" 
                style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 500 
                }}
              >
                Image Title
              </label>
              <input
                type="text"
                id="image-title"
                placeholder="Enter a title for this image"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`, 
                  borderRadius: '4px', 
                  backgroundColor: isDarkMode ? '#1f2937' : '#fff',
                  color: isDarkMode ? '#f9fafb' : '#111827',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = isDarkMode ? '#6366f1' : '#4f46e5'} 
                onBlur={(e) => e.target.style.borderColor = isDarkMode ? '#4b5563' : '#d1d5db'}
              />
            </div>
            
            <div style={{ marginBottom: '1.25rem' }}>
              <label 
                htmlFor="image-description"
                style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: 500 
                }}
              >
                Description
              </label>
              <textarea
                id="image-description"
                placeholder="Add a description for this image..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`, 
                  borderRadius: '4px', 
                  backgroundColor: isDarkMode ? '#1f2937' : '#fff',
                  color: isDarkMode ? '#f9fafb' : '#111827',
                  fontSize: '1rem',
                  resize: 'vertical',
                  minHeight: '100px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = isDarkMode ? '#6366f1' : '#4f46e5'} 
                onBlur={(e) => e.target.style.borderColor = isDarkMode ? '#4b5563' : '#d1d5db'}
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* Modal footer */}
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderTop: '1px solid #333', 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '1rem' 
        }}>
          <button 
            style={{ 
              padding: '0.6rem 1.2rem', 
              backgroundColor: 'transparent', 
              border: `1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'}`, 
              color: isDarkMode ? '#f9fafb' : '#111827', 
              borderRadius: '4px', 
              fontWeight: 500, 
              cursor: 'pointer',
              transition: 'background-color 0.2s, border-color 0.2s' 
            }} 
            onClick={onClose}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6';
              e.currentTarget.style.borderColor = isDarkMode ? '#6b7280' : '#9ca3af';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = isDarkMode ? '#4b5563' : '#d1d5db';
            }}
          >
            Cancel
          </button>
          <button 
            style={{ 
              padding: '0.6rem 1.2rem', 
              backgroundColor: image ? (isDarkMode ? '#6366f1' : '#4f46e5') : (isDarkMode ? '#4b5563' : '#9ca3af'), 
              border: 'none', 
              color: 'white', 
              borderRadius: '4px', 
              fontWeight: 500, 
              cursor: image ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s'
            }} 
            onClick={handleSave}
            disabled={!image}
            onMouseOver={(e) => {
              if (image) {
                e.currentTarget.style.backgroundColor = isDarkMode ? '#4f46e5' : '#4338ca';
              }
            }}
            onMouseOut={(e) => {
              if (image) {
                e.currentTarget.style.backgroundColor = isDarkMode ? '#6366f1' : '#4f46e5';
              }
            }}
          >
            Save Image
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddImageModal;