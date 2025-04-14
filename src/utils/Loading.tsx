// src/components/Loading.tsx
import React from 'react';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

// Define the keyframes animation in the component
const spinKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Loading: React.FC<LoadingProps> = ({ 
  size = 'medium', 
  color = '#4361ee', 
  text = 'Loading...', 
  fullScreen = false 
}) => {
  // Add the keyframes to the document head if it doesn't exist
  React.useEffect(() => {
    if (!document.getElementById('loading-keyframes')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'loading-keyframes';
      styleEl.innerHTML = spinKeyframes;
      document.head.appendChild(styleEl);
      
      return () => {
        const existingStyle = document.getElementById('loading-keyframes');
        if (existingStyle) {
          document.head.removeChild(existingStyle);
        }
      };
    }
  }, []);

  // Rest of your component code remains the same
  const getSpinnerSize = () => {
    switch(size) {
      case 'small':
        return { width: '16px', height: '16px' };
      case 'large':
        return { width: '48px', height: '48px' };
      case 'medium':
      default:
        return { width: '32px', height: '32px' };
    }
  };

  const spinnerStyle = {
    ...getSpinnerSize(),
    borderColor: `${color} transparent transparent transparent`
  };

  const containerStyle = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 9999
  } as React.CSSProperties : {};

  return (
    <div style={containerStyle} className="loading-container">
      <div className="loading-wrapper" style={{ textAlign: 'center' }}>
        <div className="spinner" style={{
          display: 'inline-block',
          position: 'relative',
        }}>
          <div style={{
            ...spinnerStyle,
            position: 'absolute',
            borderRadius: '50%',
            border: `3px solid`,
            animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
            animationDelay: '0s'
          }}></div>
          <div style={{
            ...spinnerStyle,
            position: 'absolute',
            borderRadius: '50%',
            border: `3px solid`,
            animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
            animationDelay: '0.3s'
          }}></div>
          <div style={{
            ...spinnerStyle,
            position: 'absolute',
            borderRadius: '50%',
            border: `3px solid`,
            animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
            animationDelay: '0.6s'
          }}></div>
          <div style={{
            ...spinnerStyle,
            position: 'absolute',
            borderRadius: '50%',
            border: `3px solid`,
            animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
            animationDelay: '0.9s'
          }}></div>
        </div>
        {text && <div style={{ marginTop: '16px', color }}>{text}</div>}
      </div>
    </div>
  );
};

export default Loading;