import React from 'react';
import { GroupuiText, GroupuiBadge, GroupuiAvatar } from '@group-ui/group-ui-react';

const DirectMessageItem = ({ directMessage, isActive, onClick }) => {
  // Helper function to get user display info
  const getUserInfo = () => {
    // Try different sources for user information
    if (directMessage.user) {
      return {
        firstName: directMessage.user.firstName || '',
        lastName: directMessage.user.lastName || '',
        isOnline: directMessage.user.isOnline || false
      };
    }
    
    // Fallback to members array if user property doesn't exist
    if (directMessage.members && directMessage.members.length > 0) {
      // Find the other user (not the current user)
      const otherMember = directMessage.members.find(member => 
        member.userId !== directMessage.currentUserId
      );
      
      if (otherMember) {
        return {
          firstName: otherMember.firstName || '',
          lastName: otherMember.lastName || '',
          isOnline: otherMember.isOnline || false
        };
      }
    }
    
    // Final fallback
    return {
      firstName: 'Unknown',
      lastName: 'User',
      isOnline: false
    };
  };
  
  const userInfo = getUserInfo();
  const displayName = `${userInfo.firstName} ${userInfo.lastName}`.trim() || 'Unknown User';
  const avatarName = userInfo.firstName && userInfo.lastName 
    ? `${userInfo.firstName} ${userInfo.lastName}` 
    : 'Unknown User';
  return (
    <div
      onClick={onClick}
      style={{
        padding: '8px 16px',
        cursor: 'pointer',
        backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
        borderRadius: isActive ? '6px' : '0',
        margin: isActive ? '0 8px' : '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ position: 'relative' }}>
          <GroupuiAvatar 
            size="xs" 
            name={avatarName}
          />
          <div style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: '8px',
            height: '8px',
            backgroundColor: userInfo.isOnline ? '#2ed573' : '#747d8c',
            borderRadius: '50%',
            border: '2px solid #008075'
          }}></div>
        </div>
        <GroupuiText style={{ 
          color: isActive ? 'white' : 'rgba(255,255,255,0.9)',
          fontWeight: isActive ? 'bold' : 'normal'
        }}>
          {displayName}
        </GroupuiText>
      </div>
      {directMessage.unreadCount > 0 && (
        <GroupuiBadge 
          value={directMessage.unreadCount}
          style={{ 
            backgroundColor: '#ff4757',
            color: 'white'
          }}
        />
      )}
    </div>
  );
};

export default DirectMessageItem;