import React, { useState } from 'react';
import {
  GroupuiButton,
  GroupuiText,
  GroupuiSearchField,
  GroupuiLoadingSpinner,
  GroupuiAvatar
} from '@group-ui/group-ui-react';
import apiService from '../services/apiService';
import CustomModal from './CustomModal';

const UserListModal = ({ isOpen, nscId, currentUserId, onClose, onSelectUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  console.log('🔍 UserListModal rendered with state:', { 
    isOpen,
    nscId, 
    currentUserId, 
    searchTerm, 
    searchResults: searchResults.length,
    loading,
    error 
  });

  // Debounced search for users
  React.useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      setError('');
      
      try {
        console.log('🔎 Searching for users with term:', searchTerm);
        const response = await apiService.searchUsers(nscId, searchTerm);
        console.log('📋 Search response:', response);
        
        // Handle different possible response structures
        const users = response.data?.users || response.users || response.data || [];
        
        // Ensure users is an array and filter out invalid entries
        const validUsers = Array.isArray(users) ? users : [];
        const filteredResults = validUsers
          .filter(user => user && typeof user === 'object' && user.id && user.id !== currentUserId)
          .map(user => ({
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            username: user.username || '',
            email: user.email || '',
            role: user.role || '',
            isOnline: user.isOnline || false
          }));
        
        console.log('✅ Filtered search results:', filteredResults);
        setSearchResults(filteredResults);
      } catch (error) {
        console.error('❌ Failed to search users:', error);
        setError('Failed to search users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, nscId, currentUserId]);

  const handleUserSelect = (userId) => {
    console.log('👤 User selected:', userId);
    
    // Find the selected user from search results to pass complete user info
    const selectedUser = searchResults.find(user => user.id === userId);
    
    if (selectedUser) {
      console.log('📋 Passing user info:', selectedUser);
      onSelectUser(userId, selectedUser);
    } else {
      console.warn('⚠️ Could not find user info for selected user');
      onSelectUser(userId);
    }
  };

  const handleClose = () => {
    console.log('❌ Closing UserListModal');
    setSearchTerm('');
    setSearchResults([]);
    setError('');
    onClose();
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Start Direct Message"
      size="medium"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Search Field */}
        <GroupuiSearchField
          placeholder="Search for a user to start a conversation..."
          value={searchTerm}
          onGroupuiChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />

        {/* Search Results */}
        <div style={{ 
          minHeight: '300px', 
          maxHeight: '400px', 
          overflowY: 'auto',
          border: '1px solid #e9ecef',
          borderRadius: '8px'
        }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <GroupuiLoadingSpinner size="m" />
              <GroupuiText style={{ color: '#6c757d', marginTop: '16px' }}>
                Searching users...
              </GroupuiText>
            </div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <GroupuiText style={{ color: '#dc3545' }}>
                {error}
              </GroupuiText>
            </div>
          ) : !searchTerm.trim() ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <span style={{ fontSize: '48px', opacity: 0.5 }}>👋</span>
              <GroupuiText style={{ color: '#6c757d', marginTop: '16px' }}>
                Search for a user to start a private conversation
              </GroupuiText>
            </div>
          ) : searchResults.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <span style={{ fontSize: '48px', opacity: 0.5 }}>🔍</span>
              <GroupuiText style={{ color: '#6c757d', marginTop: '16px' }}>
                No users found matching "{searchTerm}"
              </GroupuiText>
            </div>
          ) : (
            <div>
              {searchResults.map(user => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user.id)}
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f3f4',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <GroupuiAvatar 
                      size="m" 
                      name={`${user.firstName || ''} ${user.lastName || ''}`} 
                    />
                    {/* Online status indicator */}
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '12px',
                      height: '12px',
                      backgroundColor: user.isOnline ? '#2ed573' : '#747d8c',
                      borderRadius: '50%',
                      border: '2px solid white'
                    }}></div>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <GroupuiText weight="bold" style={{ fontSize: '16px' }}>
                      {user.firstName || ''} {user.lastName || ''}
                    </GroupuiText>
                    <GroupuiText style={{ color: '#6c757d', fontSize: '14px' }}>
                      {user.username || 'No username'} • {user.role?.name || user.role || 'No role'}
                    </GroupuiText>
                    {user.email && (
                      <GroupuiText style={{ color: '#6c757d', fontSize: '12px' }}>
                        {user.email}
                      </GroupuiText>
                    )}
                  </div>

                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#008075',
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    Message
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CustomModal>
  );
};

export default UserListModal;