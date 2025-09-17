const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> { socketId, nscIds, userInfo }
    this.channelRooms = new Map(); // channelId -> Set of socketIds
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupSimpleEventHandlers(); // Handles both authenticated and simple chat

    console.log('🔌 Socket.IO server initialized');
  }

  setupMiddleware() {
    // Optional authentication middleware for Socket.IO
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        console.log('🔐 Socket authentication attempt:', { 
          hasAuthToken: !!socket.handshake.auth.token,
          hasHeaderToken: !!socket.handshake.headers.authorization,
          tokenLength: token ? token.length : 0
        });
        
        if (!token) {
          // Allow connection without authentication for simple chat
          console.log('🔗 Connection without authentication - simple chat mode');
          return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('🔓 Token decoded successfully for user:', decoded.userId);
        
        // Fetch user with NSC memberships
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            nscMemberships: {
              where: { isActive: true },
              include: {
                nsc: true,
                role: true
              }
            }
          }
        });

        if (!user || !user.isActive) {
          return next(new Error('Invalid or inactive user'));
        }

        socket.userId = user.id;
        socket.user = user;
        socket.nscIds = user.nscMemberships.map(m => m.nscId);

        console.log(`🔐 User ${user.username} authenticated with NSC access:`, socket.nscIds);

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        // Allow connection to continue for simple chat even if auth fails
        console.log('🔗 Authentication failed - falling back to simple chat mode');
        next();
      }
    });
  }

  setupSimpleEventHandlers() {
    // Simple chat handlers without authentication for testing
    this.io.on('connection', (socket) => {
      
      // Handle authenticated users (full ConnectHub features)
      if (socket.userId && socket.user) {
        console.log(`🔗 Authenticated user ${socket.user.username} connected (${socket.id})`);
        
        // Store connected user
        this.connectedUsers.set(socket.userId, {
          socketId: socket.id,
          nscIds: socket.nscIds,
          userInfo: {
            id: socket.user.id,
            username: socket.user.username,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName
          }
        });

        // Join user to their NSC rooms
        socket.nscIds.forEach(nscId => {
          socket.join(`nsc:${nscId}`);
        });

        // Set up authenticated event handlers here...
        this.setupAuthenticatedHandlers(socket);
        
        // Send initial connection success
        socket.emit('connected', {
          message: 'Connected to ConnectHub',
          userId: socket.userId,
          nscMemberships: socket.user.nscMemberships.map(m => ({
            nscId: m.nscId,
            nscName: m.nsc.name,
            role: m.role.name
          }))
        });
      } 
      // Handle non-authenticated users (simple chat)
      else {
        console.log(`🔗 Anonymous user connected for simple chat (${socket.id})`);
        
        socket.on('join_simple_room', (data) => {
          const { username, room } = data;
          socket.username = username;
          socket.room = room;
          socket.join(`simple:${room}`);
          
          socket.to(`simple:${room}`).emit('user_joined_simple', { username });
          console.log(`👥 ${username} joined simple room: ${room}`);
        });

        socket.on('leave_simple_room', (data) => {
          const { username, room } = data;
          socket.leave(`simple:${room}`);
          socket.to(`simple:${room}`).emit('user_left_simple', { username });
          console.log(`👋 ${username} explicitly left simple room: ${room}`);
          // Clear the room info to prevent duplicate message on disconnect
          socket.room = null;
          socket.username = null;
        });

        socket.on('simple_message', (data) => {
          const { username, room, content, timestamp } = data;
          const messageData = {
            username,
            content,
            timestamp: timestamp || new Date().toISOString()
          };
          
          this.io.to(`simple:${room}`).emit('simple_message', messageData);
          console.log(`💬 Simple message from ${username} in ${room}: ${content}`);
        });

        socket.on('simple_typing_start', (data) => {
          const { username, room } = data;
          socket.to(`simple:${room}`).emit('simple_typing', {
            username,
            isTyping: true
          });
        });

        socket.on('simple_typing_stop', (data) => {
          const { username, room } = data;
          socket.to(`simple:${room}`).emit('simple_typing', {
            username,
            isTyping: false
          });
        });

        socket.on('disconnect', () => {
          if (socket.username && socket.room) {
            socket.to(`simple:${socket.room}`).emit('user_left_simple', { 
              username: socket.username 
            });
            console.log(`🔌 ${socket.username} disconnected from simple chat`);
          } else {
            console.log(`🔌 Anonymous user disconnected (${socket.id})`);
          }
        });
      }
    });
  }

  setupAuthenticatedHandlers(socket) {
    // Handle joining channels
    socket.on('join_channel', async (data) => {
      await this.handleJoinChannel(socket, data);
    });

    // Handle leaving channels
    socket.on('leave_channel', async (data) => {
      await this.handleLeaveChannel(socket, data);
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      await this.handleSendMessage(socket, data);
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      this.handleTypingStart(socket, data);
    });

    socket.on('typing_stop', (data) => {
      this.handleTypingStop(socket, data);
    });

    // Handle user status
    socket.on('update_status', (data) => {
      this.handleUpdateStatus(socket, data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  async handleJoinChannel(socket, data) {
    try {
      const { channelId, nscId } = data;

      console.log(`👥 User ${socket.user.username} attempting to join channel ${channelId} in NSC ${nscId}`);
      console.log(`👥 User NSC access: [${socket.nscIds.join(', ')}]`);

      // Verify user has access to this channel
      const channel = await prisma.channel.findFirst({
        where: {
          id: channelId,
          nscId,
          isActive: true,
          OR: [
            { type: 'PUBLIC' },
            {
              members: {
                some: {
                  userId: socket.userId,
                  isActive: true
                }
              }
            }
          ]
        },
        include: {
          members: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      if (!channel) {
        console.log(`❌ Channel ${channelId} not found or access denied for user ${socket.user.username}`);
        socket.emit('error', { message: 'Channel not found or access denied' });
        return;
      }

      console.log(`✅ Channel found: ${channel.name} (NSC: ${channel.nscId}, Type: ${channel.type})`);

      // Join the channel room
      const roomName = `channel:${channelId}`;
      socket.join(roomName);

      // Add to channel rooms tracking
      if (!this.channelRooms.has(channelId)) {
        this.channelRooms.set(channelId, new Set());
      }
      this.channelRooms.get(channelId).add(socket.id);

      // Notify other users in the channel
      socket.to(roomName).emit('user_joined_channel', {
        channelId,
        user: {
          id: socket.user.id,
          username: socket.user.username,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName
        }
      });

      // Send channel info to the user
      socket.emit('channel_joined', {
        channelId,
        channelName: channel.name,
        channelType: channel.type,
        members: channel.members.map(m => m.user)
      });

      console.log(`👥 User ${socket.user.username} joined channel ${channel.name}`);

    } catch (error) {
      console.error('Error joining channel:', error);
      socket.emit('error', { message: 'Failed to join channel' });
    }
  }

  async handleLeaveChannel(socket, data) {
    try {
      const { channelId } = data;
      const roomName = `channel:${channelId}`;

      socket.leave(roomName);

      // Remove from channel rooms tracking
      if (this.channelRooms.has(channelId)) {
        this.channelRooms.get(channelId).delete(socket.id);
        if (this.channelRooms.get(channelId).size === 0) {
          this.channelRooms.delete(channelId);
        }
      }

      // Notify other users in the channel
      socket.to(roomName).emit('user_left_channel', {
        channelId,
        user: {
          id: socket.user.id,
          username: socket.user.username,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName
        }
      });

      socket.emit('channel_left', { channelId });

    } catch (error) {
      console.error('Error leaving channel:', error);
      socket.emit('error', { message: 'Failed to leave channel' });
    }
  }

  async handleSendMessage(socket, data) {
    try {
      const { channelId, content, type = 'TEXT', metadata } = data;

      // Verify user has access to send messages in this channel
      const channel = await prisma.channel.findFirst({
        where: {
          id: channelId,
          isActive: true,
          OR: [
            { type: 'PUBLIC' },
            {
              members: {
                some: {
                  userId: socket.userId,
                  isActive: true
                }
              }
            }
          ]
        }
      });

      if (!channel) {
        socket.emit('error', { message: 'Channel not found or access denied' });
        return;
      }

      // Check NSC access
      console.log(`🔍 Checking NSC access - User NSCs: [${socket.nscIds.join(', ')}], Channel NSC: ${channel.nscId}`);
      if (!socket.nscIds.includes(channel.nscId)) {
        console.log(`❌ User ${socket.user.username} denied access to NSC ${channel.nscId}`);
        socket.emit('error', { message: 'No access to this NSC' });
        return;
      }

      // Save message to database
      const message = await prisma.message.create({
        data: {
          content,
          type,
          metadata: "Nothing",
          channelId,
          senderId: socket.userId
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Broadcast message to all users in the channel
      const messageData = {
        id: message.id,
        content: message.content,
        type: message.type,
        metadata: message.metadata,
        channelId: message.channelId,
        createdAt: message.createdAt,
        sender: message.sender
      };

      this.io.to(`channel:${channelId}`).emit('new_message', messageData);

      console.log(`💬 Message sent by ${socket.user.username} in channel ${channelId}`);

    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  handleTypingStart(socket, data) {
    const { channelId } = data;
    console.log(`⌨️ ${socket.user.username} started typing in channel ${channelId}`);
    socket.to(`channel:${channelId}`).emit('user_typing', {
      channelId,
      user: {
        id: socket.user.id,
        username: socket.user.username,
        firstName: socket.user.firstName,
        lastName: socket.user.lastName
      },
      isTyping: true
    });
  }

  handleTypingStop(socket, data) {
    const { channelId } = data;
    console.log(`⏹️ ${socket.user.username} stopped typing in channel ${channelId}`);
    socket.to(`channel:${channelId}`).emit('user_stopped_typing', {
      channelId,
      user: {
        id: socket.user.id,
        username: socket.user.username,
        firstName: socket.user.firstName,
        lastName: socket.user.lastName
      }
    });
  }

  handleUpdateStatus(socket, data) {
    const { status } = data; // online, away, busy, offline
    
    // Broadcast status update to all NSCs the user belongs to
    socket.nscIds.forEach(nscId => {
      socket.to(`nsc:${nscId}`).emit('user_status_changed', {
        user: {
          id: socket.user.id,
          username: socket.user.username,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName
        },
        status,
        timestamp: new Date().toISOString()
      });
    });
  }

  handleDisconnect(socket) {
    console.log(`🔌 User ${socket.user.username} disconnected (${socket.id})`);

    // Remove from connected users
    this.connectedUsers.delete(socket.userId);

    // Remove from all channel rooms
    for (const [channelId, socketIds] of this.channelRooms.entries()) {
      if (socketIds.has(socket.id)) {
        socketIds.delete(socket.id);
        
        // Notify other users in the channel
        socket.to(`channel:${channelId}`).emit('user_left_channel', {
          channelId,
          user: {
            id: socket.user.id,
            username: socket.user.username,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName
          }
        });

        if (socketIds.size === 0) {
          this.channelRooms.delete(channelId);
        }
      }
    }

    // Broadcast offline status to all NSCs
    socket.nscIds.forEach(nscId => {
      socket.to(`nsc:${nscId}`).emit('user_status_changed', {
        user: {
          id: socket.user.id,
          username: socket.user.username,
          firstName: socket.user.firstName,
          lastName: socket.user.lastName
        },
        status: 'offline',
        timestamp: new Date().toISOString()
      });
    });
  }

  // Helper methods for other parts of the application

  // Send notification to specific user
  sendToUser(userId, event, data) {
    const userConnection = this.connectedUsers.get(userId);
    if (userConnection) {
      this.io.to(userConnection.socketId).emit(event, data);
    }
  }

  // Send notification to all users in an NSC
  sendToNSC(nscId, event, data) {
    this.io.to(`nsc:${nscId}`).emit(event, data);
  }

  // Send notification to all users in a channel
  sendToChannel(channelId, event, data) {
    this.io.to(`channel:${channelId}`).emit(event, data);
  }

  // Get online users for an NSC
  getOnlineUsersInNSC(nscId) {
    const onlineUsers = [];
    for (const [userId, connection] of this.connectedUsers.entries()) {
      if (connection.nscIds.includes(nscId)) {
        onlineUsers.push(connection.userInfo);
      }
    }
    return onlineUsers;
  }

  // Get online users in a channel
  getOnlineUsersInChannel(channelId) {
    const onlineUsers = [];
    const socketIds = this.channelRooms.get(channelId);
    
    if (socketIds) {
      for (const [userId, connection] of this.connectedUsers.entries()) {
        if (socketIds.has(connection.socketId)) {
          onlineUsers.push(connection.userInfo);
        }
      }
    }
    
    return onlineUsers;
  }
}

module.exports = new SocketService();
