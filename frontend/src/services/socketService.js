import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.messageListeners = new Set();
    this.typingListeners = new Set();
    this.typingStopListeners = new Set();
    this.statusListeners = new Set();
    this.connectionListeners = new Set();
    this.disconnectionListeners = new Set();
  }

  connect(user, nscId) {
    if (this.socket) {
      this.disconnect();
    }

    // Safe environment variable access for React
    const getEnvVar = (name, fallback) => {
      try {
        return (typeof process !== 'undefined' && 
                process.env && 
                process.env[name]) || fallback;
      } catch (e) {
        return fallback;
      }
    };

    const serverUrl = getEnvVar('REACT_APP_SERVER_URL', 'http://localhost:3000');
    
    // Get JWT token from localStorage
    const token = localStorage.getItem('token');
    
    console.log('Connecting to socket server:', serverUrl);
    console.log('Auth data:', { hasToken: !!token, userId: user.id, nscId });
    
    this.socket = io(serverUrl, {
      auth: {
        token: token, // Use JWT token from localStorage
        userId: user.id,
        nscId: nscId
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      autoConnect: true
    });

    this.setupEventListeners();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('Socket connection timeout after 15 seconds');
        reject(new Error('Connection timeout'));
      }, 15000);

      this.socket.on('connect', () => {
        // Handle basic socket.io connect event
        console.log('Socket.IO connected successfully');
        clearTimeout(timeout);
        this.connected = true;
        this.notifyConnectionListeners({ connected: true });
        resolve({ connected: true });
      });

      this.socket.on('connected', (data) => {
        // Handle custom connected event from server
        console.log('Custom connected event received:', data);
        clearTimeout(timeout);
        this.connected = true;
        this.notifyConnectionListeners({ connected: true, data });
        resolve(data);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        clearTimeout(timeout);
        this.notifyConnectionListeners({ connected: false, error });
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        this.connected = false;
        this.notifyConnectionListeners({ connected: false });
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.notifyConnectionListeners({ connected: false });
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Message events
    this.socket.on('new_message', (messageData) => {
      this.notifyMessageListeners('new_message', messageData);
    });

    // Typing events
    this.socket.on('user_typing', (typingData) => {
      console.log('📥 Received user_typing event:', typingData);
      this.notifyTypingListeners(typingData);
    });

    this.socket.on('user_stopped_typing', (typingData) => {
      console.log('📥 Received user_stopped_typing event:', typingData);
      this.notifyTypingStopListeners(typingData);
    });

    // User status events
    this.socket.on('user_status_changed', (statusData) => {
      this.notifyStatusListeners('status_changed', statusData);
    });

    this.socket.on('user_joined_channel', (userData) => {
      this.notifyStatusListeners('user_joined', userData);
    });

    this.socket.on('user_left_channel', (userData) => {
      this.notifyStatusListeners('user_left', userData);
    });

    // Channel events
    this.socket.on('channel_joined', (channelData) => {
      this.notifyConnectionListeners({ type: 'channel_joined', data: channelData });
    });

    this.socket.on('channel_left', (channelData) => {
      this.notifyConnectionListeners({ type: 'channel_left', data: channelData });
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.notifyConnectionListeners({ type: 'error', error });
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('Disconnected from server');
      this.notifyConnectionListeners({ connected: false });
    });

    this.socket.on('reconnect', () => {
      this.connected = true;
      console.log('Reconnected to server');
      this.notifyConnectionListeners({ connected: true });
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Attempting to reconnect...', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect after maximum attempts');
      this.notifyConnectionListeners({ connected: false, error: 'Reconnection failed' });
    });
  }

  // Channel operations
  joinChannel(channelId, nscId) {
    if (this.socket && this.connected) {
      this.socket.emit('join_channel', { channelId, nscId });
    } else {
      console.warn('Cannot join channel - socket not connected');
    }
  }

  leaveChannel(channelId) {
    if (this.socket && this.connected) {
      this.socket.emit('leave_channel', { channelId });
    }
  }

  // Message operations
  sendMessage(channelId, content, type = 'TEXT', metadata = null) {
    if (this.socket && this.connected) {
      this.socket.emit('send_message', {
        channelId,
        content,
        type,
        metadata
      });
    } else {
      console.warn('Cannot send message - socket not connected');
    }
  }

  // Typing indicators
  startTyping(channelId) {
    if (this.socket && this.connected) {
      console.log('📤 Emitting typing start for channel:', channelId);
      this.socket.emit('typing_start', { channelId });
    } else {
      console.warn('Cannot start typing - socket not connected');
    }
  }

  stopTyping(channelId) {
    if (this.socket && this.connected) {
      console.log('📤 Emitting typing stop for channel:', channelId);
      this.socket.emit('typing_stop', { channelId });
    } else {
      console.warn('Cannot stop typing - socket not connected');
    }
  }

  // Force stop typing - utility method for debugging
  forceStopTyping(channelId) {
    console.log('🚫 Force stopping typing for channel:', channelId);
    this.stopTyping(channelId);
  }

  // Status updates
  updateStatus(status) {
    if (this.socket && this.connected) {
      this.socket.emit('update_status', { status });
    }
  }

  // Event listeners management
  addMessageListener(callback) {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  removeMessageListener(callback) {
    this.messageListeners.delete(callback);
  }

  addTypingListener(callback) {
    this.typingListeners.add(callback);
    return () => this.typingListeners.delete(callback);
  }

  removeTypingListener(callback) {
    this.typingListeners.delete(callback);
  }

  addTypingStopListener(callback) {
    this.typingStopListeners.add(callback);
    return () => this.typingStopListeners.delete(callback);
  }

  removeTypingStopListener(callback) {
    this.typingStopListeners.delete(callback);
  }

  addStatusListener(callback) {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  removeStatusListener(callback) {
    this.statusListeners.delete(callback);
  }

  addConnectionListener(callback) {
    this.connectionListeners.add(callback);
    return () => this.connectionListeners.delete(callback);
  }

  removeConnectionListener(callback) {
    this.connectionListeners.delete(callback);
  }

  addDisconnectionListener(callback) {
    this.disconnectionListeners.add(callback);
    return () => this.disconnectionListeners.delete(callback);
  }

  removeDisconnectionListener(callback) {
    this.disconnectionListeners.delete(callback);
  }

  // Notify listeners
  notifyMessageListeners(event, data) {
    this.messageListeners.forEach(callback => {
      try {
        callback(data); // Just pass the data, not the event type
      } catch (error) {
        console.error('Error in message listener:', error);
      }
    });
  }

  notifyTypingListeners(data) {
    this.typingListeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in typing listener:', error);
      }
    });
  }

  notifyTypingStopListeners(data) {
    this.typingStopListeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in typing stop listener:', error);
      }
    });
  }

  notifyStatusListeners(event, data) {
    this.statusListeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in status listener:', error);
      }
    });
  }

  notifyConnectionListeners(data) {
    // Notify connection listeners for connect events
    if (data.connected === true) {
      this.connectionListeners.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in connection listener:', error);
        }
      });
    }
    
    // Notify disconnection listeners for disconnect events
    if (data.connected === false && !data.type) {
      this.disconnectionListeners.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in disconnection listener:', error);
        }
      });
    }
  }

  // Utility methods
  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }

  getSocket() {
    return this.socket;
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;
