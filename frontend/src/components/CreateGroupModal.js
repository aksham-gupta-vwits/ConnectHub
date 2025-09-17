import React, { useState } from 'react';
import {
  GroupuiButton,
  GroupuiInput,
  GroupuiTextarea,
  GroupuiText,
  GroupuiSelect,
  GroupuiSelectOption,
  GroupuiSearchField,
  GroupuiLoadingSpinner,
  GroupuiAvatar,
  GroupuiCheckbox
} from '@group-ui/group-ui-react';
import apiService from '../services/apiService';
import CustomModal from './CustomModal';

const CreateGroupModal = ({ isOpen, nscId, onClose, onCreateGroup }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'GROUP', // Default to GROUP type
    isPrivate: false
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');

  // Debounced search for users
  React.useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const response = await apiService.searchUsers(nscId, searchTerm);
        setSearchResults(response.users || []);
      } catch (error) {
        console.error('Failed to search users:', error);
        setError('Failed to search users');
      } finally {
        setSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, nscId]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleUserToggle = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Group name is required');
      return;
    }

    if (selectedUsers.length === 0) {
      setError('Please select at least one user to add to the group');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const groupData = {
        ...formData,
        type: formData.isPrivate ? 'PRIVATE' : 'GROUP',
        memberIds: selectedUsers.map(user => user.id)
      };

      await onCreateGroup(groupData);
    } catch (error) {
      console.error('Failed to create group:', error);
      setError('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    console.log('❌ Closing CreateGroupModal');
    setFormData({ name: '', description: '', type: 'GROUP', isPrivate: false });
    setSearchTerm('');
    setSearchResults([]);
    setSelectedUsers([]);
    setError('');
    onClose();
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Group"
      size="medium"
      showFooter={false}
    >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Group Name */}
          <GroupuiInput
            label="Group Name"
            value={formData.name}
            onGroupuiChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter group name"
            required
          />

          {/* Group Description */}
          <GroupuiTextarea
            label="Description (Optional)"
            value={formData.description}
            onGroupuiChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter group description"
            rows={3}
          />

          {/* Privacy Setting */}
          <GroupuiCheckbox
            checked={formData.isPrivate}
            onGroupuiChange={(e) => handleInputChange('isPrivate', e.target.checked)}
            label="Private Group"
            helper-text="Private groups are only visible to members"
          />

          {/* User Search */}
          <div>
            <GroupuiText weight="bold" style={{ marginBottom: '8px', display: 'block' }}>
              Add Members
            </GroupuiText>
            <GroupuiSearchField
              placeholder="Search for users to add..."
              value={searchTerm}
              onGroupuiChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: '12px' }}
            />

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <GroupuiText style={{ fontSize: '14px', color: '#6c757d', marginBottom: '8px' }}>
                  Selected Members ({selectedUsers.length})
                </GroupuiText>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  {selectedUsers.map(user => (
                    <div
                      key={user.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        backgroundColor: '#008075',
                        color: 'white',
                        borderRadius: '16px',
                        fontSize: '12px'
                      }}
                    >
                      <GroupuiAvatar size="xs" name={`${user.firstName} ${user.lastName}`} />
                      <span>{user.firstName} {user.lastName}</span>
                      <button
                        type="button"
                        onClick={() => handleUserToggle(user)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          padding: '0',
                          fontSize: '14px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto',
              border: '1px solid #e9ecef',
              borderRadius: '8px'
            }}>
              {searchLoading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <GroupuiLoadingSpinner size="s" />
                </div>
              ) : searchTerm.trim() && searchResults.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center' }}>
                  <GroupuiText style={{ color: '#6c757d' }}>
                    No users found
                  </GroupuiText>
                </div>
              ) : searchTerm.trim() ? (
                <div>
                  {searchResults.map(user => {
                    const isSelected = selectedUsers.find(u => u.id === user.id);
                    return (
                      <div
                        key={user.id}
                        onClick={() => handleUserToggle(user)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f1f3f4',
                          backgroundColor: isSelected ? '#e8f5e8' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <GroupuiAvatar size="s" name={`${user.firstName} ${user.lastName}`} />
                        <div style={{ flex: 1 }}>
                          <GroupuiText weight="bold">
                            {user.firstName} {user.lastName}
                          </GroupuiText>
                          <GroupuiText style={{ color: '#6c757d', fontSize: '14px' }}>
                            {user.username} • {user.role.name}
                          </GroupuiText>
                        </div>
                        {isSelected && (
                          <span style={{ color: '#28a745', fontSize: '16px' }}>✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '16px', textAlign: 'center' }}>
                  <GroupuiText style={{ color: '#6c757d' }}>
                    Start typing to search for users
                  </GroupuiText>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <GroupuiText style={{ color: '#dc3545', fontSize: '14px' }}>
              {error}
            </GroupuiText>
          )}

          {/* Footer Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e9ecef' }}>
            <GroupuiButton variant="secondary" onClick={handleClose}>
              Cancel
            </GroupuiButton>
            <GroupuiButton 
              variant="primary" 
              onClick={handleSubmit}
              disabled={loading || !formData.name.trim() || selectedUsers.length === 0}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </GroupuiButton>
          </div>
        </form>
    </CustomModal>
  );
};

export default CreateGroupModal;