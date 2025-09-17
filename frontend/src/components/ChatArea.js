import React, { useState, useEffect, useRef } from 'react';
import { 
  GroupuiInput, 
  GroupuiButton, 
  GroupuiText, 
  GroupuiIcon,
  GroupuiAvatar,
  GroupuiCard,
  GroupuiSpinner
} from '@group-ui/group-ui-react';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socketService';

const ChatArea = ({ activeChannel, activeUser }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (activeChannel || activeUser) {
      loadMessages();
      
      // Join channel for real-time updates
      if (socketService.isConnected() && activeChannel) {
        const selectedNSC = JSON.parse(localStorage.getItem('selectedNSC'));
        if (selectedNSC) {
          socketService.joinChannel(activeChannel.id, selectedNSC.id);
        }
      }
    }

    // Cleanup: leave channel when component unmounts or channel changes
    return () => {
      if (socketService.isConnected() && activeChannel) {
        socketService.leaveChannel(activeChannel.id);
      }
    };
  }, [activeChannel, activeUser]);

  useEffect(() => {
    // Socket event listeners
    const removeMessageListener = socketService.addMessageListener((event, data) => {
      if (event === 'new_message') {
        handleNewMessage(data);
      }
    });

    const removeTypingListener = socketService.addTypingListener((event, data) => {
      if (event === 'user_typing') {
        handleTyping(data);
      }
    });

    return () => {
      removeMessageListener();
      removeTypingListener();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      let endpoint;
      if (activeChannel) {
        // Use correct API format with NSC ID
        const selectedNSC = JSON.parse(localStorage.getItem('selectedNSC'));
        if (!selectedNSC) {
          console.error('No NSC selected');
          return;
        }
        endpoint = `/api/messages/${selectedNSC.id}/${activeChannel.id}`;
      } else if (activeUser) {
        console.log('Direct message API not implemented yet');
        return;
      }
      
      console.log('Loading messages from:', endpoint);
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Messages loaded:', data);
        setMessages(data.messages || data);
      } else {
        console.error('Failed to load messages:', response.status);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  const handleTyping = (data) => {
    if (data.user.id !== user.id) {
      if (data.isTyping) {
        setTypingUsers(prev => [...prev.filter(u => u.id !== data.user.id), data.user]);
      } else {
        setTypingUsers(prev => prev.filter(u => u.id !== data.user.id));
      }
    }
  };

  const handleStopTyping = (data) => {
    setTypingUsers(prev => prev.filter(u => u.id !== data.user.id));
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (socketService.isConnected() && activeChannel) {
      // Use Socket.IO for real-time messaging
      socketService.sendMessage(activeChannel.id, newMessage.trim());
      setNewMessage('');
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        socketService.stopTyping(activeChannel.id);
      }
    } else {
      console.error('Socket not connected or no active channel');
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Handle typing indicators
    if (socketService.isConnected() && activeChannel && !isTyping && value.trim()) {
      setIsTyping(true);
      socketService.startTyping(activeChannel.id);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping && activeChannel) {
          setIsTyping(false);
          socketService.stopTyping(activeChannel.id);
        }
      }, 2000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const getDisplayName = () => {
    if (activeChannel) {
      return `#${activeChannel.name}`;
    }
    if (activeUser) {
      return `${activeUser.firstName} ${activeUser.lastName}`;
    }
    return 'Select a channel or user';
  };

  const getDisplayInfo = () => {
    if (activeChannel) {
      return activeChannel.description || `${activeChannel.memberCount || 0} members`;
    }
    if (activeUser) {
      return activeUser.role || 'Direct Message';
    }
    return '';
  };

  if (!activeChannel && !activeUser) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        marginLeft: window.innerWidth > 768 ? '260px' : '0',
        marginTop: '60px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <GroupuiIcon 
            name="chat-24" 
            style={{ 
              fontSize: '64px', 
              color: '#6c757d',
              marginBottom: '16px'
            }}
          />
          <GroupuiText variant="h5" style={{ 
            color: '#6c757d',
            marginBottom: '8px'
          }}>
            Welcome to ConnectHub
          </GroupuiText>
          <GroupuiText variant="body1" style={{ color: '#6c757d' }}>
            Select a channel or start a direct message to begin chatting
          </GroupuiText>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      marginLeft: window.innerWidth > 768 ? '260px' : '0',
      marginTop: '60px'
    }}>
      {/* Chat Header */}
      <div style={{
        padding: '16px 24px',
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {activeChannel ? (
            <GroupuiIcon 
              name={activeChannel.isPrivate ? "lock-24" : "hash-24"} 
              style={{ color: '#4a154b' }}
            />
          ) : (
            <GroupuiAvatar
              size="small"
              name={`${activeUser.firstName} ${activeUser.lastName}`}
            />
          )}
          <div>
            <GroupuiText variant="h6" style={{ fontWeight: 'bold' }}>
              {getDisplayName()}
            </GroupuiText>
            <GroupuiText variant="body2" style={{ color: '#6c757d' }}>
              {getDisplayInfo()}
            </GroupuiText>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <GroupuiButton variant="ghost" size="small">
            <GroupuiIcon name="phone-24" />
          </GroupuiButton>
          <GroupuiButton variant="ghost" size="small">
            <GroupuiIcon name="video-24" />
          </GroupuiButton>
          <GroupuiButton variant="ghost" size="small">
            <GroupuiIcon name="info-24" />
          </GroupuiButton>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 24px',
        backgroundColor: '#f8f9fa'
      }}>
        {isLoading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '40px' 
          }}>
            <GroupuiSpinner size="medium" />
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const showAvatar = index === 0 || 
                messages[index - 1].senderId !== message.senderId ||
                new Date(message.createdAt) - new Date(messages[index - 1].createdAt) > 300000; // 5 minutes

              return (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    marginBottom: showAvatar ? '16px' : '2px',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}
                >
                  <div style={{ width: '36px', flexShrink: 0 }}>
                    {showAvatar && (
                      <GroupuiAvatar
                        size="small"
                        name={`${message.sender.firstName} ${message.sender.lastName}`}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {showAvatar && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <GroupuiText variant="subtitle2" style={{
                          fontWeight: 'bold',
                          color: '#1a1a1a'
                        }}>
                          {message.sender.firstName} {message.sender.lastName}
                        </GroupuiText>
                        <GroupuiText variant="caption" style={{
                          color: '#6c757d'
                        }}>
                          {formatMessageTime(message.createdAt)}
                        </GroupuiText>
                      </div>
                    )}
                    <GroupuiText variant="body1" style={{
                      color: '#1a1a1a',
                      lineHeight: 1.4,
                      wordBreak: 'break-word'
                    }}>
                      {message.content}
                    </GroupuiText>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 0',
                color: '#6c757d'
              }}>
                <div style={{ width: '36px' }}></div>
                <GroupuiText variant="body2" style={{ fontStyle: 'italic' }}>
                  {typingUsers.map(u => `${u.firstName} ${u.lastName}`).join(', ')} 
                  {typingUsers.length === 1 ? ' is typing...' : ' are typing...'}
                </GroupuiText>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div style={{
        padding: '16px 24px',
        backgroundColor: 'white',
        borderTop: '1px solid #e0e0e0'
      }}>
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: '12px' }}>
          <GroupuiInput
            value={newMessage}
            onGroupuiChange={handleInputChange}
            placeholder={`Message ${getDisplayName()}`}
            style={{ flex: 1 }}
            size="large"
            multiline
            maxRows={4}
          />
          <GroupuiButton
            type="submit"
            variant="primary"
            disabled={!newMessage.trim()}
            style={{
              backgroundColor: '#4a154b',
              borderColor: '#4a154b'
            }}
          >
            <GroupuiIcon name="send-24" />
          </GroupuiButton>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;
