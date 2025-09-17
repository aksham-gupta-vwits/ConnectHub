import React, { useState, useEffect, useRef } from 'react';
import { GroupuiButton, GroupuiText } from '@group-ui/group-ui-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import socketService from '../services/socketService';
import Sidebar from '../components/Sidebar';
import ChatHeader from '../components/ChatHeader';
import MessageArea from '../components/MessageArea';
import MessageInput from '../components/MessageInput';
import CreateGroupModal from '../components/CreateGroupModal';
import CreatePublicChannelModal from '../components/CreatePublicChannelModal';
import UserListModal from '../components/UserListModal';
import AdminApprovalPage from '../components/AdminApprovalPage';
import CustomNotification from '../components/CustomNotification';

const ChatPage = () => {
  const { user, selectedNSC, availableNSCs, selectNSC, logout } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [channelJoined, setChannelJoined] = useState(false);
  
  // Channel and message state
  const [activeChannel, setActiveChannel] = useState(null);
  const [channels, setChannels] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [messages, setMessages] = useState([]);
  
  // UI state
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCreatePublicChannelModal, setShowCreatePublicChannelModal] = useState(false);
  const [showUserListModal, setShowUserListModal] = useState(false);
  const [showAdminApproval, setShowAdminApproval] = useState(false);
  const [selectedUserForDM, setSelectedUserForDM] = useState(null); // Store selected user info
  
  // Refs for cleanup
  const typingTimeoutRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear typing timeout on unmount
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Stop typing indicator if active
      if (isTyping && activeChannel && socketService.isConnected()) {
        socketService.stopTyping(activeChannel);
      }
    };
  }, []);

  // Derived state - categorize channels
  const [publicChannels, setPublicChannels] = useState([]);
  const [privateChannels, setPrivateChannels] = useState([]);
  const [groupChannels, setGroupChannels] = useState([]);

  // Socket connection effect
  useEffect(() => {
    if (user && selectedNSC) {
      const initializeSocket = async () => {
        try {
          console.log('🔌 Initializing socket connection for user:', user.email);
          await socketService.connect(user, selectedNSC.nscId);
          console.log('✅ Socket connected successfully');
        } catch (error) {
          console.error('❌ Failed to connect to real-time service:', error);
          setError('Failed to connect to real-time service. Some features may not work properly.');
          
          // Retry connection after 5 seconds
          setTimeout(() => {
            console.log('🔄 Retrying socket connection...');
            initializeSocket();
          }, 5000);
        }
      };

      initializeSocket();
      
      const handleConnect = () => {
        console.log('🔗 Socket connection established');
        setSocketConnected(true);
        setError(''); // Clear any connection errors
      };
      
      const handleDisconnect = () => {
        console.log('🔌 Socket disconnected');
        setSocketConnected(false);
        setChannelJoined(false);
        setError('Connection lost. Attempting to reconnect...');
      };
      
      // Use the proper connection listener API
      socketService.addConnectionListener(handleConnect);
      socketService.addDisconnectionListener(handleDisconnect);
      
      return () => {
        socketService.removeConnectionListener(handleConnect);
        socketService.removeDisconnectionListener(handleDisconnect);
        socketService.disconnect();
      };
    }
  }, [user, selectedNSC]);

  // Channel joining effect
  useEffect(() => {
    if (activeChannel && selectedNSC && socketService.isConnected()) {
      socketService.joinChannel(activeChannel, selectedNSC.nscId);
      setChannelJoined(true);
    }
    
    return () => {
      if (activeChannel && socketService.isConnected()) {
        // Stop typing indicator when leaving channel
        if (isTyping) {
          socketService.stopTyping(activeChannel);
          setIsTyping(false);
        }
        socketService.leaveChannel(activeChannel);
        setChannelJoined(false);
      }
      // Clear typing users when changing channels
      setTypingUsers(new Set());
    };
  }, [activeChannel, selectedNSC, isTyping]);

  // Message listeners effect
  useEffect(() => {
    const handleNewMessage = (message) => {
      if (message.channelId === activeChannel) {
        setMessages(prevMessages => [...prevMessages, message]);
      }
    };

    const handleTypingChange = (data) => {
      console.log('👀 Typing event received:', data);
      if (data.channelId === activeChannel && data.user?.id !== user.id) {
        const typingKey = `${data.user.id}-${data.user.firstName} ${data.user.lastName}`;
        
        if (data.isTyping) {
          console.log('🔤 User started typing:', data.user.firstName);
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.add(typingKey);
            return newSet;
          });
        } else {
          console.log('🛑 User stopped typing:', data.user.firstName);
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(typingKey);
            return newSet;
          });
        }
      }
    };

    // The backend sends both start and stop through the same user_typing event
    // So we only need to listen to one event and check the isTyping property
    socketService.addMessageListener(handleNewMessage);
    socketService.addTypingListener(handleTypingChange);

    return () => {
      socketService.removeMessageListener(handleNewMessage);
      socketService.removeTypingListener(handleTypingChange);
    };
  }, [activeChannel, user.id]);

  // Load initial data when NSC changes
  useEffect(() => {
    if (selectedNSC) {
      loadInitialData();
    }
  }, [selectedNSC]);

  // Load channels and direct messages
  const loadInitialData = async () => {
    if (!selectedNSC) return;
    
    setLoading(true);
    setError('');
    
    try {
      const [channelsResult, directMessagesResult] = await Promise.allSettled([
        apiService.getChannels(selectedNSC.nscId),
        apiService.getDirectMessages(selectedNSC.nscId)
      ]);

      if (channelsResult.status === 'fulfilled') {
        setChannels(channelsResult.value.channels || []);
        handleChannelSelect(channelsResult.value.channels.filter(c => c.type === 'PUBLIC')[0]?.id || null);
        setPublicChannels(channelsResult.value.channels.filter(c => c.type === 'PUBLIC'));
        setPrivateChannels(channelsResult.value.channels.filter(c => c.type === 'PRIVATE'));
        setGroupChannels(channelsResult.value.channels.filter(c => c.type === 'GROUP'));
      } else {
        console.error('Failed to load channels:', channelsResult.reason);
      }

      if (directMessagesResult.status === 'fulfilled') {
        setDirectMessages(directMessagesResult.value.conversations || []);
      } else {
        console.error('Failed to load direct messages:', directMessagesResult.reason);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle channel selection
  const handleChannelSelect = async (channelId) => {
    setActiveChannel(channelId);
    setMessages([]);
    setError('');
    
    try {
      const messagesData = await apiService.getMessages(selectedNSC.nscId, channelId);
      setMessages(messagesData.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError('Failed to load messages. Please try again.');
    }
  };

  // Handle message sending
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel) return;

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      if (activeChannel) {
        socketService.stopTyping(activeChannel);
      }
    }

    if (!socketService.isConnected()) {
      setError('Cannot send message - not connected to server. Please wait for reconnection.');
      return;
    }

    if (!activeChannel) {
      setError('Please select a channel first.');
      return;
    }

    if (!channelJoined) {
      setError('Please wait for channel to load before sending messages.');
      return;
    }
    
    console.log('📤 Sending message:', { channel: activeChannel, content: newMessage.trim() });
    socketService.sendMessage(activeChannel, newMessage.trim());
    setNewMessage('');
  };

  // Handle typing
  const handleTyping = (value) => {
    setNewMessage(value);
    
    if (!activeChannel || !socketService.isConnected()) {
      console.log('⚠️ Cannot handle typing - no channel or not connected');
      return;
    }
    
    // Clear existing timeout first
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    // Stop typing if input is empty
    if (!value.trim()) {
      if (isTyping) {
        console.log('🛑 Stopping typing indicator (empty input) for channel:', activeChannel);
        setIsTyping(false);
        socketService.stopTyping(activeChannel);
      }
      return;
    }
    
    // Start typing if user is typing and not already indicated as typing
    if (!isTyping) {
      console.log('🔤 Starting typing indicator for channel:', activeChannel);
      setIsTyping(true);
      socketService.startTyping(activeChannel);
    }
    
    // Set new timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      console.log('🛑 Stopping typing indicator (timeout) for channel:', activeChannel);
      setIsTyping(false);
      if (activeChannel && socketService.isConnected()) {
        socketService.stopTyping(activeChannel);
      }
      typingTimeoutRef.current = null;
    }, 2000);
  };

  // Create or get DM channel with user info
  const createOrGetDMChannel = async (targetUserId, userInfo = null) => {
    try {
      const response = await apiService.createOrGetDirectMessage(selectedNSC.nscId, targetUserId);
      const dmChannel = response.channel;
      
      console.log('📱 DM Channel response:', dmChannel);
      console.log('👤 User info provided:', userInfo);
      
      // Enhance the DM channel with proper user information for sidebar display
      let enhancedDMChannel = dmChannel;
      
      // Try to get user info from various sources in order of preference
      let targetUser = null;
      
      // 1. Use provided userInfo (from UserListModal selection)
      if (userInfo) {
        targetUser = userInfo;
      }
      // 2. Try to get from channel members
      else if (dmChannel.members) {
        const memberInfo = dmChannel.members.find(member => member.userId === targetUserId);
        if (memberInfo) {
          targetUser = {
            id: memberInfo.userId,
            firstName: memberInfo.firstName,
            lastName: memberInfo.lastName,
            username: memberInfo.username,
            email: memberInfo.email,
            isOnline: memberInfo.isOnline || false
          };
        }
      }
      // 3. Try to get from stored selected user
      else if (selectedUserForDM && selectedUserForDM.id === targetUserId) {
        targetUser = selectedUserForDM;
      }
      
      // If we have user info, enhance the DM channel
      if (targetUser) {
        enhancedDMChannel = {
          ...dmChannel,
          user: {
            id: targetUser.id,
            firstName: targetUser.firstName || '',
            lastName: targetUser.lastName || '',
            username: targetUser.username || '',
            email: targetUser.email || '',
            isOnline: targetUser.isOnline || false
          }
        };
        console.log('✨ Enhanced DM Channel with user info:', enhancedDMChannel);
      } else {
        console.warn('⚠️ No user info available for DM channel, sidebar may show Unknown User');
      }
      
      // Add to direct messages if not already there
      setDirectMessages(prev => {
        const existing = prev.find(dm => dm.id === enhancedDMChannel.id);
        if (existing) {
          // Update existing with enhanced info if we have better data
          if (targetUser && (!existing.user || !existing.user.firstName)) {
            return prev.map(dm => dm.id === enhancedDMChannel.id ? enhancedDMChannel : dm);
          }
          return prev;
        }
        return [...prev, enhancedDMChannel];
      });
      
      // Select the channel
      handleChannelSelect(enhancedDMChannel.id);
      setShowUserListModal(false);
      setSelectedUserForDM(null); // Clear selected user
      setSuccessMessage('Direct message conversation started successfully!');
    } catch (error) {
      console.error('Failed to create/get DM channel:', error);
      setError('Failed to start direct message. Please try again.');
    }
  };

  // Get active channel title
  const getActiveTitle = () => {
    if (!activeChannel) return '';
    
    const channel = [...channels, ...directMessages].find(c => c.id === activeChannel);
    if (!channel) return 'Unknown Channel';
    
    if (channel.type === 'DIRECT_MESSAGE') {
      const otherUser = channel.members?.find(member => member.userId !== user.id);
      return otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Direct Message';
    }
    
    return channel.name || 'Unnamed Channel';
  };

  // Get active channel info
  const getActiveChannelInfo = () => {
    if (!activeChannel) return null;
    
    const channel = [...channels, ...directMessages].find(c => c.id === activeChannel);
    if (!channel) return null;
    
    return {
      ...channel,
      currentUserId: user.id
    };
  };

  // Format message time
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  // Debug function to manually force stop typing
  const forceStopTyping = () => {
    if (activeChannel && isTyping) {
      console.log('🚫 Manually forcing stop typing for channel:', activeChannel);
      setIsTyping(false);
      socketService.forceStopTyping(activeChannel);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  // Expose debug function to window for testing
  useEffect(() => {
    window.forceStopTyping = forceStopTyping;
    return () => {
      delete window.forceStopTyping;
    };
  }, [activeChannel, isTyping]);

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      {/* Error notification */}
      {error && (
        <CustomNotification 
          message={error}
          severity="error"
          onClose={() => setError('')}
          autoHideDuration={8000}
        />
      )}

      {/* Success notification */}
      {successMessage && (
        <CustomNotification 
          message={successMessage}
          severity="success"
          onClose={() => setSuccessMessage('')}
          autoHideDuration={4000}
          style={{ top: error ? '80px' : '20px' }} // Stack below error if both present
        />
      )}

      {/* Sidebar */}
      <Sidebar
        selectedNSC={selectedNSC}
        user={user}
        loading={loading}
        publicChannels={publicChannels}
        privateChannels={privateChannels}
        groupChannels={groupChannels}
        directMessages={directMessages}
        activeChannel={activeChannel}
        onChannelSelect={handleChannelSelect}
        onCreateGroup={() => {
          console.log('📝 Opening create group modal');
          setShowCreateGroupModal(true);
        }}
        onCreatePublicChannel={() => {
          console.log('🔘 Opening create public channel modal');
          setShowCreatePublicChannelModal(true);
        }}
        onStartDirectMessage={() => {
          console.log('💬 Opening user list modal for DM');
          setShowUserListModal(true);
        }}
        onLogout={logout}
      />

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {showAdminApproval ? (
          /* Admin Approval Page */
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header with back button */}
            <div style={{
              height: '60px',
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              padding: '0 24px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <GroupuiButton
                variant="ghost"
                size="s"
                onClick={() => setShowAdminApproval(false)}
                style={{ marginRight: '16px' }}
              >
                ← Back to Chat
              </GroupuiButton>
              <GroupuiText weight="bold" style={{ fontSize: '18px' }}>
                User Approvals
              </GroupuiText>
            </div>
            
            {/* Admin Approval Content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <AdminApprovalPage />
            </div>
          </div>
        ) : (
          /* Normal Chat Interface */
          <>
            {/* Header */}
            <ChatHeader
              selectedNSC={selectedNSC}
              availableNSCs={availableNSCs}
              socketConnected={socketConnected}
              activeTitle={getActiveTitle()}
              user={user}
              onNSCChange={selectNSC}
              onShowAdminApproval={() => {
                console.log('👥 Opening admin approval page');
                setShowAdminApproval(true);
              }}
            />

            {/* Message area */}
            <MessageArea
              activeChannel={activeChannel}
              messages={messages}
              loading={loading}
              typingUsers={typingUsers}
              getActiveTitle={getActiveTitle}
              getActiveChannelInfo={getActiveChannelInfo}
              formatMessageTime={formatMessageTime}
            />

            {/* Message input */}
            <MessageInput
              activeChannel={activeChannel}
              newMessage={newMessage}
              onMessageChange={(e) => handleTyping(e.target.value)}
              onSubmit={sendMessage}
              getActiveTitle={getActiveTitle}
              disabled={!socketConnected || !channelJoined}
            />
          </>
        )}
      </div>

      {/* Modals */}
      <CreateGroupModal 
        isOpen={showCreateGroupModal}
        nscId={selectedNSC.nscId}
        onClose={() => {
          console.log('❌ Closing create group modal');
          setShowCreateGroupModal(false);
        }}
        onCreateGroup={async (groupData) => {
          try {
            const response = await apiService.createGroupChannel(selectedNSC.nscId, groupData);
            const newChannel = response.data;
            setChannels(prev => [...prev, newChannel]);
            setGroupChannels(prev => [...prev, newChannel]);
            handleChannelSelect(newChannel.id);
            setShowCreateGroupModal(false);
            setSuccessMessage(`Group "${newChannel.name}" created successfully!`);
          } catch (error) {
            console.error('Failed to create group:', error);
            setError('Failed to create group. Please try again.');
          }
        }}
      />

      <CreatePublicChannelModal 
        isOpen={showCreatePublicChannelModal}
        onClose={() => {
          console.log('❌ Closing create public channel modal');
          setShowCreatePublicChannelModal(false);
        }}
        onCreateChannel={async (channelData) => {
          try {
            const response = await apiService.createPublicChannel(selectedNSC.nscId, channelData);
            const newChannel = response.data;
            setChannels(prev => [...prev, newChannel]);
            setPublicChannels(prev => [...prev, newChannel]);
            handleChannelSelect(newChannel.id);
            setShowCreatePublicChannelModal(false);
            setSuccessMessage(`Public channel "${newChannel.name}" created successfully!`);
          } catch (error) {
            console.error('Failed to create public channel:', error);
            setError('Failed to create public channel. Please try again.');
          }
        }}
      />

      <UserListModal 
        isOpen={showUserListModal}
        nscId={selectedNSC.nscId}
        currentUserId={user.id}
        onClose={() => {
          console.log('❌ Closing user list modal');
          setShowUserListModal(false);
          setSelectedUserForDM(null); // Clear selected user when closing
        }}
        onSelectUser={(userId, userInfo) => {
          console.log('🎯 User selected for DM:', { userId, userInfo });
          setSelectedUserForDM(userInfo); // Store the user info
          createOrGetDMChannel(userId, userInfo);
        }}
      />
    </div>
  );
};

export default ChatPage;