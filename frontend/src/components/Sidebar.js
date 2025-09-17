import React, { useState } from 'react';
import { 
  GroupuiText,
  GroupuiButton,
  GroupuiAvatar,
  GroupuiSearchField,
  GroupuiLoadingSpinner,
  GroupuiHeadline
} from '@group-ui/group-ui-react';
import ChannelItem from './ChannelItem';
import DirectMessageItem from './DirectMessageItem';

const Sidebar = ({
  selectedNSC,
  user,
  loading,
  publicChannels,
  privateChannels,
  groupChannels,
  directMessages,
  activeChannel,
  onChannelSelect,
  onCreateGroup,
  onCreatePublicChannel,
  onStartDirectMessage,
  onLogout
}) => {
  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    publicChannels: true,
    privateChannels: true,
    groupChannels: true,
    directMessages: true
  });

  // Check if user is admin
  const isAdmin = () => {
    let userRole = user.nscMemberships.find((u)=> u.nscId === selectedNSC.nscId).role
    return userRole?.toUpperCase() === 'ADMIN';
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  return (
    <div style={{ 
      width: '280px', 
      backgroundColor: '#008075',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh'
    }}>
      {/* Sidebar Header */}
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <GroupuiText weight="bold" style={{ fontSize: '20px', color: 'white' }}>
          ConnectHub
        </GroupuiText>
        {selectedNSC && (
          <GroupuiText style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
            {selectedNSC.nscName}
          </GroupuiText>
        )}
      </div>

      {/* Search */}
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <GroupuiSearchField 
          placeholder="Search channels, people..." 
          size="s"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white'
          }}
        />
      </div>

      {/* Channels and DMs with Collapsible Sections */}
      <div style={{ padding: '8px 0', flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <GroupuiLoadingSpinner size="s" />
            <GroupuiText style={{ color: 'rgba(255,255,255,0.8)', marginTop: '8px' }}>
              Loading...
            </GroupuiText>
          </div>
        ) : (
          <div>
            {/* Public Channels Section */}
            <div style={{ marginBottom: '16px' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}
                onClick={() => toggleSection('publicChannels')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    fontSize: '12px', 
                    transform: expandedSections.publicChannels ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}>
                    ▶
                  </span>
                  <GroupuiHeadline heading="h9" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Public Channels
                  </GroupuiHeadline>
                </div>
                {isAdmin() && (
                  <div 
                    style={{ 
                      width: '24px', 
                      height: '24px', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('🔘 Public Channels plus button clicked by admin');
                      onCreatePublicChannel();
                    }}
                    title="Create new public channel"
                  >
                    +
                  </div>
                )}
              </div>
              
              {expandedSections.publicChannels && (
                <div>
                  {publicChannels.length > 0 ? 
                    publicChannels.map(channel => (
                      <ChannelItem 
                        key={channel.id}
                        channel={channel}
                        isActive={activeChannel === channel.id}
                        onClick={() => onChannelSelect(channel.id)}
                        icon="#"
                      />
                    )) : (
                      <div style={{ padding: '16px', textAlign: 'center' }}>
                        <GroupuiText style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                          No public channels
                        </GroupuiText>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Private Channels Section */}
            {privateChannels.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                  }}
                  onClick={() => toggleSection('privateChannels')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '12px', 
                      transform: expandedSections.privateChannels ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }}>
                      ▶
                    </span>
                    <GroupuiHeadline heading="h9" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      Private Channels
                    </GroupuiHeadline>
                  </div>
                </div>
                
                {expandedSections.privateChannels && (
                  <div>
                    {privateChannels.map(channel => (
                      <ChannelItem 
                        key={channel.id}
                        channel={channel}
                        isActive={activeChannel === channel.id}
                        onClick={() => onChannelSelect(channel.id)}
                        icon="🔒"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Group Conversations Section */}
            <div style={{ marginBottom: '16px' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}
                onClick={() => toggleSection('groupChannels')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    fontSize: '12px', 
                    transform: expandedSections.groupChannels ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}>
                    ▶
                  </span>
                  <GroupuiHeadline heading="h9" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Group Conversations
                  </GroupuiHeadline>
                </div>
                <div 
                  style={{ 
                    width: '24px', 
                    height: '24px', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('🔘 Group Conversations plus button clicked');
                    onCreateGroup();
                  }}
                  title="Create new group"
                >
                  +
                </div>
              </div>
              
              {expandedSections.groupChannels && (
                <div>
                  {groupChannels.length > 0 ? 
                    groupChannels.map(channel => (
                      <ChannelItem 
                        key={channel.id}
                        channel={channel}
                        isActive={activeChannel === channel.id}
                        onClick={() => onChannelSelect(channel.id)}
                        icon="👥"
                      />
                    )) : (
                      <div style={{ padding: '16px', textAlign: 'center' }}>
                        <GroupuiText style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                          No group conversations
                        </GroupuiText>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Direct Messages Section */}
            <div style={{ marginBottom: '16px' }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}
                onClick={() => toggleSection('directMessages')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    fontSize: '12px', 
                    transform: expandedSections.directMessages ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}>
                    ▶
                  </span>
                  <GroupuiHeadline heading="h9" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Direct Messages
                  </GroupuiHeadline>
                </div>
                <div 
                  style={{ 
                    width: '24px', 
                    height: '24px', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('🔘 Direct Messages plus button clicked');
                    onStartDirectMessage();
                  }}
                  title="Start new direct message"
                >
                  +
                </div>
              </div>
              
              {expandedSections.directMessages && (
                <div>
                  {directMessages && directMessages.length > 0 ? 
                    directMessages.map(dm => (
                      <DirectMessageItem
                        key={dm.id}
                        directMessage={dm}
                        isActive={activeChannel === dm.id}
                        onClick={() => onChannelSelect(dm.id)}
                      />
                    )) : (
                      <div style={{ padding: '16px', textAlign: 'center' }}>
                        <GroupuiText style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                          No direct messages
                        </GroupuiText>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Profile at bottom */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GroupuiAvatar size="s" name={`${user?.firstName} ${user?.lastName}`} />
            <div>
              <GroupuiText weight="bold" style={{ fontSize: '14px', color: 'white' }}>
                {user?.firstName} {user?.lastName}
              </GroupuiText>
              <GroupuiText style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                {user?.role}
              </GroupuiText>
            </div>
          </div>
          <GroupuiButton 
            inverted
            size="s" 
            onClick={onLogout}
          >
            Logout
          </GroupuiButton>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;