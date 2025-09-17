import React from 'react';
import { 
  GroupuiText, 
  GroupuiAvatar,
  GroupuiLoadingSpinner 
} from '@group-ui/group-ui-react';

const MessageArea = ({
  activeChannel,
  messages,
  loading,
  typingUsers,
  getActiveTitle,
  getActiveChannelInfo,
  formatMessageTime
}) => {
  if (!activeChannel) {
    return (
      <div style={{
        flex: 1,
        padding: '16px 24px',
        overflowY: 'auto',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <span style={{ fontSize: '64px', opacity: 0.5 }}>💬</span>
          <GroupuiText style={{ color: '#6c757d', textAlign: 'center' }}>
            Welcome to ConnectHub!<br />
            Select a channel to start chatting
          </GroupuiText>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        flex: 1,
        padding: '16px 24px',
        overflowY: 'auto',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <GroupuiLoadingSpinner size="m" />
          <GroupuiText style={{ color: '#6c757d', marginTop: '16px' }}>
            Loading messages...
          </GroupuiText>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div style={{
        flex: 1,
        padding: '16px 24px',
        overflowY: 'auto',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <span style={{ fontSize: '48px', opacity: 0.5 }}>🚀</span>
          <GroupuiText style={{ color: '#6c757d', textAlign: 'center' }}>
            {(() => {
              const channelInfo = getActiveChannelInfo();
              if (channelInfo?.type === 'DIRECT_MESSAGE') {
                const otherUser = channelInfo.members?.find(member => member.userId !== channelInfo.currentUserId);
                return `This is the beginning of your conversation with ${otherUser?.firstName} ${otherUser?.lastName}`;
              } else if (channelInfo?.type === 'GROUP') {
                return `Welcome to ${channelInfo.name}! This is the beginning of this group conversation.`;
              } else {
                return `Welcome to #${channelInfo?.name}! This is the beginning of this channel.`;
              }
            })()}
          </GroupuiText>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      padding: '16px 24px',
      overflowY: 'auto',
      backgroundColor: '#f8f9fa'
    }}>
      {/* Messages */}
      {messages.map((message, index) => {
        const showAvatar = index === 0 || messages[index - 1].sender.id !== message.sender.id;
        const isLastFromSender = index === messages.length - 1 || messages[index + 1].sender.id !== message.sender.id;
        
        return (
          <div 
            key={message.id} 
            style={{
              marginBottom: isLastFromSender ? '16px' : '2px',
              display: 'flex',
              gap: '12px'
            }}
          >
            {/* Avatar - only show for first message in group */}
            <div style={{ width: '36px', height: '36px' }}>
              {showAvatar && (
                <GroupuiAvatar 
                  size="s" 
                  name={`${message.sender.firstName} ${message.sender.lastName}`} 
                />
              )}
            </div>
            
            {/* Message content */}
            <div style={{ flex: 1 }}>
              {showAvatar && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  marginBottom: '4px' 
                }}>
                  <GroupuiText weight="bold" style={{ fontSize: '15px' }}>
                    {message.sender.firstName} {message.sender.lastName}
                  </GroupuiText>
                  <GroupuiText style={{ color: '#6c757d', fontSize: '12px' }}>
                    {formatMessageTime(message.createdAt)}
                  </GroupuiText>
                </div>
              )}
              <GroupuiText style={{ 
                fontSize: '14px', 
                lineHeight: '1.4',
                wordBreak: 'break-word'
              }}>
                {message.content}
              </GroupuiText>
            </div>
          </div>
        );
      })}
      
      {/* Typing indicator */}
      {typingUsers.size > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '8px 12px',
          backgroundColor: 'rgba(108, 117, 125, 0.1)',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#6c757d',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            display: 'flex',
            gap: '2px'
          }}>
            <div style={{
              width: '4px',
              height: '4px',
              backgroundColor: '#6c757d',
              borderRadius: '50%',
              animation: 'typing 1.4s infinite'
            }}></div>
            <div style={{
              width: '4px',
              height: '4px',
              backgroundColor: '#6c757d',
              borderRadius: '50%',
              animation: 'typing 1.4s infinite 0.2s'
            }}></div>
            <div style={{
              width: '4px',
              height: '4px',
              backgroundColor: '#6c757d',
              borderRadius: '50%',
              animation: 'typing 1.4s infinite 0.4s'
            }}></div>
          </div>
          <span>
            {Array.from(typingUsers).map(userInfo => userInfo.split('-').slice(-1)[0] || 'Someone').join(', ')} 
            {typingUsers.size === 1 ? ' is' : ' are'} typing...
          </span>
        </div>
      )}
    </div>
  );
};

export default MessageArea;