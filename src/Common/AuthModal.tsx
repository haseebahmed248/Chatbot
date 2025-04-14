import React from 'react';
import { Link } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, isDarkMode }) => {
  if (!isOpen) return null;

  // Define styles as JavaScript objects
  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(5px)',
    },
    modal: {
      width: '100%',
      maxWidth: '450px',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      animation: 'modalFadeIn 0.3s ease-out',
      backgroundColor: isDarkMode ? '#252836' : '#ffffff',
      color: isDarkMode ? '#e0e0e0' : '#333',
      border: isDarkMode ? '1px solid #3a3c4a' : '1px solid #e0e0e0',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 24px',
      borderBottom: isDarkMode ? '1px solid #3a3c4a' : '1px solid #e0e0e0',
    },
    headerTitle: {
      margin: 0,
      fontSize: '18px',
      fontWeight: 600,
    },
    closeBtn: {
      background: 'transparent',
      border: 'none',
      fontSize: '18px',
      cursor: 'pointer',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      transition: 'background-color 0.2s',
      color: isDarkMode ? '#ccc' : '#666',
    },
    body: {
      padding: '30px 24px',
      textAlign: 'center' as const,
    },
    icon: {
      fontSize: '48px',
      marginBottom: '20px',
      color: '#5166d8',
    },
    text: {
      margin: '0 0 10px',
      fontSize: '16px',
    },
    subtext: {
      fontSize: '14px',
      opacity: 0.8,
    },
    footer: {
      padding: '20px 24px',
      display: 'flex',
      justifyContent: 'center',
      gap: '16px',
      borderTop: isDarkMode ? '1px solid #3a3c4a' : '1px solid #e0e0e0',
    },
    btnBase: {
      padding: '12px 24px',
      borderRadius: '6px',
      fontWeight: 500,
      textDecoration: 'none',
      transition: 'all 0.3s ease',
      display: 'inline-block',
      textAlign: 'center' as const,
      minWidth: '120px',
    },
    primaryBtn: {
      backgroundColor: '#5166d8',
      color: 'white',
    },
    secondaryBtn: {
      backgroundColor: 'transparent',
      border: '1px solid #5166d8',
      color: '#5166d8',
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.headerTitle}>Authentication Required</h3>
          <button style={styles.closeBtn} onClick={onClose}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        <div style={styles.body}>
          <div style={styles.icon}>
            <i className="fa-solid fa-lock"></i>
          </div>
          <p style={styles.text}>You need to be logged in to use this feature.</p>
          <p style={styles.subtext}>Create an account or log in to continue generating images.</p>
        </div>
        <div style={styles.footer}>
          <Link to="/login" style={{...styles.btnBase, ...styles.secondaryBtn}}>
            Log In
          </Link>
          <Link to="/register" style={{...styles.btnBase, ...styles.primaryBtn}}>
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;