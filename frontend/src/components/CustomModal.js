import React, { useEffect } from 'react';
import { GroupuiButton } from '@group-ui/group-ui-react';

const CustomModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  showFooter = true, 
  footerButtons,
  size = 'medium' // small, medium, large
}) => {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const getModalWidth = () => {
    switch (size) {
      case 'small': return '400px';
      case 'large': return '800px';
      default: return '600px'; // medium
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          maxWidth: getModalWidth(),
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div
            style={{
              padding: '24px 24px 16px 24px',
              borderBottom: '1px solid #e9ecef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#333'
              }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                padding: '0',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
              title="Close modal"
            >
              ×
            </button>
          </div>
        )}

        {/* Content */}
        <div
          style={{
            padding: '24px',
            flex: 1,
            overflowY: 'auto'
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {showFooter && (
          <div
            style={{
              padding: '16px 24px 24px 24px',
              borderTop: '1px solid #e9ecef',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}
          >
            {footerButtons || (
              <GroupuiButton variant="secondary" onClick={onClose}>
                Cancel
              </GroupuiButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomModal;
