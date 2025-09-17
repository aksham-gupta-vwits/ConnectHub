import React, { useEffect, useState } from 'react';

const CustomNotification = ({ 
  message, 
  severity = 'info', // 'success', 'warning', 'error', 'info'
  onClose, 
  autoHideDuration = 5000,
  style = {}
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHideDuration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose && onClose();
    }, 300); // Allow fade out animation
  };

  const getColors = () => {
    switch (severity) {
      case 'success':
        return {
          background: '#d4edda',
          border: '#c3e6cb',
          text: '#155724',
          icon: '✅'
        };
      case 'warning':
        return {
          background: '#fff3cd',
          border: '#ffeaa7',
          text: '#856404',
          icon: '⚠️'
        };
      case 'error':
        return {
          background: '#f8d7da',
          border: '#f1aeb5',
          text: '#721c24',
          icon: '❌'
        };
      default: // info
        return {
          background: '#d1ecf1',
          border: '#bee5eb',
          text: '#0c5460',
          icon: 'ℹ️'
        };
    }
  };

  const colors = getColors();

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        maxWidth: '400px',
        minWidth: '300px',
        padding: '16px',
        backgroundColor: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        color: colors.text,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'all 0.3s ease-in-out',
        ...style
      }}
    >
      {/* Icon */}
      <div style={{ 
        fontSize: '18px',
        flexShrink: 0,
        marginTop: '2px'
      }}>
        {colors.icon}
      </div>

      {/* Message */}
      <div style={{ 
        flex: 1,
        fontSize: '14px',
        lineHeight: '1.4',
        wordBreak: 'break-word'
      }}>
        {message}
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          color: colors.text,
          cursor: 'pointer',
          fontSize: '18px',
          padding: '0',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          opacity: 0.7,
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.opacity = '1';
          e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.opacity = '0.7';
          e.target.style.backgroundColor = 'transparent';
        }}
        title="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default CustomNotification;
