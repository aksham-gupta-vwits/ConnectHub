import React, { useState } from 'react';
import {
  GroupuiButton,
  GroupuiInput,
  GroupuiTextarea,
  GroupuiText,
  GroupuiLoadingSpinner
} from '@group-ui/group-ui-react';
import CustomModal from './CustomModal';

const CreatePublicChannelModal = ({ isOpen, onClose, onCreateChannel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  console.log('🔘 CreatePublicChannelModal rendered with state:', { 
    isOpen,
    formData, 
    loading,
    error 
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Channel name is required');
      return;
    }

    // Validate channel name format (alphanumeric, underscore, hyphen only)
    if (!/^[a-zA-Z0-9_-]+$/.test(formData.name)) {
      setError('Channel name can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔘 Creating public channel with data:', formData);
      await onCreateChannel(formData);
    } catch (error) {
      console.error('❌ Failed to create public channel:', error);
      setError('Failed to create public channel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log('❌ Closing CreatePublicChannelModal');
    setFormData({ name: '', description: '' });
    setError('');
    onClose();
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Public Channel"
      size="medium"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Channel Name */}
        <div>
          <GroupuiText style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
            Channel Name *
          </GroupuiText>
          <GroupuiInput
            value={formData.name}
            onGroupuiChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g. general, announcements, tech-support"
            autoFocus
            style={{ width: '100%' }}
          />
          <GroupuiText style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
            Channel names can only contain letters, numbers, underscores, and hyphens.
          </GroupuiText>
        </div>

        {/* Description */}
        <div>
          <GroupuiText style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
            Description (Optional)
          </GroupuiText>
          <GroupuiTextarea
            value={formData.description}
            onGroupuiChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="What's this channel about?"
            rows={3}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>

        {/* Public Channel Info */}
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#e7f3ff', 
          borderLeft: '4px solid #0066cc',
          borderRadius: '4px'
        }}>
          <GroupuiText style={{ fontSize: '14px', color: '#0066cc' }}>
            📢 <strong>Public channels</strong> are visible to all users in your NSC. Anyone can join and participate in the conversation.
          </GroupuiText>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: '#ffe6e6', 
            borderLeft: '4px solid #dc3545',
            borderRadius: '4px'
          }}>
            <GroupuiText style={{ color: '#dc3545', fontSize: '14px' }}>
              {error}
            </GroupuiText>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <GroupuiButton 
            variant="secondary" 
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </GroupuiButton>
          <GroupuiButton 
            variant="primary" 
            type="submit"
            // disabled={loading || !formData.name.trim()}
            style={{ minWidth: '120px' }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GroupuiLoadingSpinner size="s" />
                Creating...
              </div>
            ) : (
              'Create Channel'
            )}
          </GroupuiButton>
        </div>
      </form>
    </CustomModal>
  );
};

export default CreatePublicChannelModal;
