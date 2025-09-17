const express = require('express');
const { body, query, validationResult } = require('express-validator');

const { prisma } = require('../config/database');
const { authenticateToken, requireNSCAccess } = require('../middleware/auth');
const socketService = require('../services/socketService');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get messages for a channel
router.get('/:nscId/:channelId', [
  requireNSCAccess,
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('before').optional().isISO8601().toDate()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { nscId, channelId } = req.params;
    const { limit = 50, offset = 0, before } = req.query;

    // Check if user has access to channel
    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        nscId,
        isActive: true,
        OR: [
          { type: 'PUBLIC' },
          {
            type: { in: ['PRIVATE', 'DIRECT_MESSAGE', 'GROUP'] },
            members: {
              some: {
                userId: req.user.id,
                isActive: true
              }
            }
          }
        ]
      }
    });

    if (!channel) {
      return res.status(404).json({
        error: 'Channel not found',
        message: 'Channel not found or you do not have access to it'
      });
    }

    const whereClause = {
      channelId,
      ...(before && { createdAt: { lt: before } })
    };

    const [messages, totalCount] = await Promise.all([
      prisma.message.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.message.count({ where: whereClause })
    ]);

    res.json({
      messages: messages.reverse().map(message => ({
        id: message.id,
        channelId: message.channelId,
        content: message.content,
        type: message.type,
        metadata: message.metadata,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        sender: message.sender
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > offset + limit
      },
      channel: {
        id: channel.id,
        name: channel.name,
        type: channel.type
      }
    });

  } catch (error) {
    next(error);
  }
});

// Send message to channel
router.post('/:nscId/:channelId', [
  requireNSCAccess,
  body('content').isLength({ min: 1, max: 4000 }).trim(),
  body('type').optional().isIn(['TEXT', 'FILE', 'IMAGE']),
  body('metadata').optional().isObject()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { nscId, channelId } = req.params;
    const { content, type = 'TEXT', metadata } = req.body;

    // Check if user has access to channel
    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        nscId,
        isActive: true,
        OR: [
          { type: 'PUBLIC' },
          {
            type: { in: ['PRIVATE', 'DIRECT_MESSAGE', 'GROUP'] },
            members: {
              some: {
                userId: req.user.id,
                isActive: true
              }
            }
          }
        ]
      }
    });

    if (!channel) {
      return res.status(404).json({
        error: 'Channel not found',
        message: 'Channel not found or you do not have access to it'
      });
    }

    // Check if user is a member (for non-public channels)
    if (channel.type !== 'PUBLIC') {
      const membership = await prisma.channelMember.findFirst({
        where: {
          channelId,
          userId: req.user.id,
          isActive: true
        }
      });

      if (!membership) {
        return res.status(403).json({
          error: 'Not a member',
          message: 'You must be a member to send messages to this channel'
        });
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        type,
        metadata: metadata || null,
        channelId,
        senderId: req.user.id
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

    // Broadcast message via Socket.IO (for users connected via WebSocket)
    const messageData = {
      id: message.id,
      content: message.content,
      type: message.type,
      metadata: message.metadata,
      createdAt: message.createdAt,
      sender: message.sender
    };
    
    socketService.sendToChannel(channelId, 'new_message', messageData);

    res.status(201).json({
      message: 'Message sent successfully',
      data: messageData
    });

  } catch (error) {
    next(error);
  }
});

// Update message (sender only)
router.put('/:nscId/:channelId/:messageId', [
  requireNSCAccess,
  body('content').isLength({ min: 1, max: 4000 }).trim()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { nscId, channelId, messageId } = req.params;
    const { content } = req.body;

    // Find message and verify ownership
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        channelId,
        senderId: req.user.id,
        channel: { nscId }
      }
    });

    if (!message) {
      return res.status(404).json({
        error: 'Message not found',
        message: 'Message not found or you do not have permission to edit it'
      });
    }

    // Check if message is older than 15 minutes (edit window)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      return res.status(400).json({
        error: 'Edit window expired',
        message: 'Messages can only be edited within 15 minutes of being sent'
      });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { content },
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

    res.json({
      message: 'Message updated successfully',
      data: {
        id: updatedMessage.id,
        content: updatedMessage.content,
        type: updatedMessage.type,
        metadata: updatedMessage.metadata,
        createdAt: updatedMessage.createdAt,
        updatedAt: updatedMessage.updatedAt,
        sender: updatedMessage.sender
      }
    });

  } catch (error) {
    next(error);
  }
});

// Delete message (sender or admin)
router.delete('/:nscId/:channelId/:messageId', requireNSCAccess, async (req, res, next) => {
  try {
    const { nscId, channelId, messageId } = req.params;

    // Find message
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        channelId,
        channel: { nscId }
      }
    });

    if (!message) {
      return res.status(404).json({
        error: 'Message not found'
      });
    }

    // Check if user can delete (sender or has delete_messages permission)
    const canDelete = message.senderId === req.user.id ||
                     req.nscMembership.role.permissions.includes('admin') ||
                     req.nscMembership.role.permissions.includes('delete_messages');

    if (!canDelete) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'You do not have permission to delete this message'
      });
    }

    await prisma.message.delete({
      where: { id: messageId }
    });

    res.json({
      message: 'Message deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// Search messages in channel
router.get('/:nscId/:channelId/search', [
  requireNSCAccess,
  query('q').isLength({ min: 1, max: 100 }),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { nscId, channelId } = req.params;
    const { q, limit = 20, offset = 0 } = req.query;

    // Check if user has access to channel
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
                userId: req.user.id,
                isActive: true
              }
            }
          }
        ]
      }
    });

    if (!channel) {
      return res.status(404).json({
        error: 'Channel not found',
        message: 'Channel not found or you do not have access to it'
      });
    }

    const whereClause = {
      channelId,
      content: {
        contains: q,
        mode: 'insensitive'
      }
    };

    const [messages, totalCount] = await Promise.all([
      prisma.message.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.message.count({ where: whereClause })
    ]);

    res.json({
      messages: messages.map(message => ({
        id: message.id,
        content: message.content,
        type: message.type,
        metadata: message.metadata,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        sender: message.sender
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > offset + limit
      },
      searchQuery: q
    });

  } catch (error) {
    next(error);
  }
});

// Get message count for channel
router.get('/:nscId/:channelId/count', requireNSCAccess, async (req, res, next) => {
  try {
    const { nscId, channelId } = req.params;

    // Check if user has access to channel
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
                userId: req.user.id,
                isActive: true
              }
            }
          }
        ]
      }
    });

    if (!channel) {
      return res.status(404).json({
        error: 'Channel not found',
        message: 'Channel not found or you do not have access to it'
      });
    }

    const messageCount = await prisma.message.count({
      where: { channelId }
    });

    res.json({
      channelId,
      messageCount
    });

  } catch (error) {
    next(error);
  }
});

// Get online users in channel
router.get('/:nscId/:channelId/online-users', requireNSCAccess, async (req, res, next) => {
  try {
    const { nscId, channelId } = req.params;

    // Check if user has access to channel
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
                userId: req.user.id,
                isActive: true
              }
            }
          }
        ]
      }
    });

    if (!channel) {
      return res.status(404).json({
        error: 'Channel not found',
        message: 'Channel not found or you do not have access to it'
      });
    }

    // Get online users from Socket.IO service
    const onlineUsers = socketService.getOnlineUsersInChannel(channelId);

    res.json({
      channelId,
      onlineUsers,
      count: onlineUsers.length
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
