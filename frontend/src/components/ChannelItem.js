import React from 'react';
import { GroupuiText, GroupuiBadge } from '@group-ui/group-ui-react';

const ChannelItem = ({ channel, isActive, onClick, icon }) => {
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
        <span style={{ 
          color: 'rgba(255,255,255,0.9)',
          fontSize: '16px',
          fontWeight: 'bold',
          minWidth: '16px'
        }}>
          {icon}
        </span>
        <GroupuiText style={{ 
          color: isActive ? 'white' : 'rgba(255,255,255,0.9)',
          fontWeight: isActive ? 'bold' : 'normal'
        }}>
          {channel.name || 'Unnamed Channel'}
        </GroupuiText>
      </div>
      {channel.unreadCount > 0 && (
        <GroupuiBadge 
          value={channel.unreadCount}
          style={{ 
            backgroundColor: '#ff4757',
            color: 'white'
          }}
        />
      )}
    </div>
  );
};

export default ChannelItem;