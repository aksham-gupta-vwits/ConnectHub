const express = require('express');
const { body, query, validationResult } = require('express-validator');

const { prisma } = require('../config/database');
const { authenticateToken, requireNSCAccess, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get channels for NSC
router.get('/:nscId', [
  requireNSCAccess,
  query('type').optional().isIn(['PUBLIC', 'PRIVATE', 'DIRECT_MESSAGE', 'GROUP'])
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { nscId } = req.params;
    const { type } = req.query;

    const whereClause = {
      nscId,
      isActive: true,
      OR: [
        { type: 'PUBLIC' },
        {
          AND: [
            { type: { in: ['PRIVATE', 'DIRECT_MESSAGE', 'GROUP'] } },
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
      ]
    };

    if (type) {
      whereClause.type = type;
    }

    const channels = await prisma.channel.findMany({
      where: whereClause,
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
        },
        _count: {
          select: {
            messages: true,
            members: true
          }
        }
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      channels: channels.map(channel => ({
        id: channel.id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        createdAt: channel.createdAt,
        memberCount: channel._count.members,
        messageCount: channel._count.messages,
        members: channel.members.map(member => ({
          userId: member.user.id,
          username: member.user.username,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          joinedAt: member.joinedAt
        })),
        isMember: channel.members.some(member => member.userId === req.user.id),
        // Add unread count placeholder (TODO: implement proper unread tracking)
        unreadCount: 0
      }))
    });

  } catch (error) {
    next(error);
  }
});

// Get direct message conversations for current user
router.get('/:nscId/direct', requireNSCAccess, async (req, res, next) => {
  try {
    const { nscId } = req.params;
    const currentUserId = req.user.id;

    const directChannels = await prisma.channel.findMany({
      where: {
        nscId,
        type: 'DIRECT_MESSAGE',
        isActive: true,
        members: {
          some: {
            userId: currentUserId,
            isActive: true
          }
        }
      },
      include: {
        members: {
          where: { 
            isActive: true,
            userId: { not: currentUserId } // Get the other user
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                lastLoginAt: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const conversations = directChannels.map(channel => {
      const otherUser = channel.members[0]?.user;
      const lastMessage = channel.messages[0];
      
      return {
        id: channel.id,
        type: 'DIRECT_MESSAGE',
        user: otherUser ? {
          id: otherUser.id,
          username: otherUser.username,
          firstName: otherUser.firstName,
          lastName: otherUser.lastName,
          isOnline: false // TODO: Implement online status
        } : null,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          senderName: `${lastMessage.sender.firstName} ${lastMessage.sender.lastName}`,
          createdAt: lastMessage.createdAt
        } : null,
        messageCount: channel._count.messages,
        unreadCount: 0, // TODO: Implement unread tracking
        updatedAt: channel.updatedAt
      };
    }).filter(conv => conv.user !== null); // Filter out conversations where other user is null

    res.json({
      conversations
    });

  } catch (error) {
    next(error);
  }
});

// Get or create direct message channel between two users
router.post('/:nscId/direct/:targetUserId', requireNSCAccess, async (req, res, next) => {
  try {
    const { nscId, targetUserId } = req.params;
    const currentUserId = req.user.id;

    // Validate target user exists and has access to NSC
    const targetUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        isActive: true,
        nscMemberships: {
          some: {
            nscId,
            isActive: true
          }
        }
      }
    });

    if (!targetUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Target user not found or does not have access to this NSC'
      });
    }

    if (currentUserId === targetUserId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Cannot create direct message with yourself'
      });
    }

    // Check if DIRECT channel already exists between these users
    const existingChannel = await prisma.channel.findFirst({
      where: {
        nscId,
        type: 'DIRECT_MESSAGE',
        isActive: true,
        members: {
          every: {
            isActive: true
          }
        },
        AND: [
          {
            members: {
              some: {
                userId: currentUserId,
                isActive: true
              }
            }
          },
          {
            members: {
              some: {
                userId: targetUserId,
                isActive: true
              }
            }
          },
          {
            members: {
              none: {
                userId: { notIn: [currentUserId, targetUserId] },
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

    if (existingChannel) {
      return res.json({
        channel: {
          id: existingChannel.id,
          name: existingChannel.name,
          type: existingChannel.type,
          createdAt: existingChannel.createdAt,
          members: existingChannel.members.map(member => ({
            userId: member.user.id,
            username: member.user.username,
            firstName: member.user.firstName,
            lastName: member.user.lastName
          }))
        }
      });
    }

    // Create new DIRECT channel (no name needed - frontend will generate display name)
    const newChannel = await prisma.$transaction(async (tx) => {
      // Create the channel
      const channel = await tx.channel.create({
        data: {
          name: null, // No name for direct messages
          description: null, // No description for direct messages
          nscId,
          type: 'DIRECT_MESSAGE',
          createdBy: currentUserId
        }
      });

      // Add both users as members
      await tx.channelMember.createMany({
        data: [
          {
            channelId: channel.id,
            userId: currentUserId
          },
          {
            channelId: channel.id,
            userId: targetUserId
          }
        ]
      });

      return channel;
    });

    // Fetch the complete channel with members
    const channelWithMembers = await prisma.channel.findFirst({
      where: { id: newChannel.id },
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

    res.status(201).json({
      channel: {
        id: channelWithMembers.id,
        name: channelWithMembers.name,
        type: channelWithMembers.type,
        createdAt: channelWithMembers.createdAt,
        members: channelWithMembers.members.map(member => ({
          userId: member.user.id,
          username: member.user.username,
          firstName: member.user.firstName,
          lastName: member.user.lastName
        }))
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get specific channel details
router.get('/:nscId/:channelId', requireNSCAccess, async (req, res, next) => {
  try {
    const { nscId, channelId } = req.params;

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
                lastName: true,
                lastLoginAt: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    });

    if (!channel) {
      return res.status(404).json({
        error: 'Channel not found',
        message: 'Channel not found or you do not have access to it'
      });
    }

    res.json({
      channel: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt,
        messageCount: channel._count.messages,
        members: channel.members.map(member => ({
          userId: member.user.id,
          username: member.user.username,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          lastLoginAt: member.user.lastLoginAt,
          joinedAt: member.joinedAt
        })),
        isMember: channel.members.some(member => member.userId === req.user.id)
      }
    });

  } catch (error) {
    next(error);
  }
});

// Create new channel
router.post('/:nscId', [
  requireNSCAccess,
  requireRole(['admin', 'manage_channels', 'create_channels']),
  body('name').isLength({ min: 1, max: 50 }).matches(/^[a-zA-Z0-9_-]+$/),
  body('description').optional().isLength({ max: 500 }),
  body('type').isIn(['PUBLIC', 'PRIVATE', 'GROUP']),
  body('memberIds').optional().isArray().custom((value, { req }) => {
    if (req.body.type === 'GROUP' && (!value || value.length < 2)) {
      throw new Error('Group channels must have at least 2 initial members');
    }
    if (req.body.type === 'GROUP' && value && value.length > 20) {
      throw new Error('Group channels cannot have more than 20 members');
    }
    return true;
  })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { nscId } = req.params;
    const { name, description, type = 'PUBLIC', memberIds = [] } = req.body;

    // Check if channel name already exists in this NSC (only for named channels)
    if (type !== 'GROUP' || name) {
      const existingChannel = await prisma.channel.findFirst({
        where: {
          name,
          nscId,
          isActive: true
        }
      });

      if (existingChannel) {
        return res.status(409).json({
          error: 'Channel already exists',
          message: 'A channel with this name already exists in this NSC'
        });
      }
    }

    // Validate member IDs for group channels
    if (type === 'GROUP' && memberIds.length > 0) {
      const validMembers = await prisma.user.findMany({
        where: {
          id: { in: memberIds },
          isActive: true,
          nscMemberships: {
            some: {
              nscId,
              isActive: true
            }
          }
        },
        select: { id: true }
      });

      if (validMembers.length !== memberIds.length) {
        return res.status(400).json({
          error: 'Invalid members',
          message: 'Some specified members do not exist or do not have access to this NSC'
        });
      }
    }

    // Create channel and add members
    const result = await prisma.$transaction(async (tx) => {
      const channel = await tx.channel.create({
        data: {
          name: type === 'GROUP' && !name ? null : name, // Groups can have optional names
          description,
          type,
          nscId,
          createdBy: req.user.id
        }
      });

      // Add creator as member
      const membersToAdd = [req.user.id];
      
      // Add additional members for group channels
      if (type === 'GROUP' && memberIds.length > 0) {
        membersToAdd.push(...memberIds.filter(id => id !== req.user.id));
      }

      await tx.channelMember.createMany({
        data: membersToAdd.map(userId => ({
          channelId: channel.id,
          userId
        }))
      });

      return channel;
    });

    res.status(201).json({
      message: 'Channel created successfully',
      channel: result
    });

  } catch (error) {
    next(error);
  }
});

// Create group channel (GROUP type)
router.post('/:nscId/group', [
  requireNSCAccess,
  body('name').optional().isLength({ min: 1, max: 50 }).matches(/^[a-zA-Z0-9_\s-]+$/),
  body('description').optional().isLength({ max: 500 }),
  body('memberIds').isArray()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { nscId } = req.params;
    const { name, description, memberIds } = req.body;
    const currentUserId = req.user.id;

    // Validate all member IDs exist and have access to NSC
    const validMembers = await prisma.user.findMany({
      where: {
        id: { in: memberIds },
        isActive: true,
        nscMemberships: {
          some: {
            nscId,
            isActive: true
          }
        }
      },
      select: { 
        id: true, 
        username: true, 
        firstName: true, 
        lastName: true 
      }
    });

    if (validMembers.length !== memberIds.length) {
      return res.status(400).json({
        error: 'Invalid members',
        message: 'Some specified members do not exist or do not have access to this NSC'
      });
    }

    // Check if name is unique (if provided)
    if (name) {
      const existingChannel = await prisma.channel.findFirst({
        where: {
          name,
          nscId,
          isActive: true
        }
      });

      if (existingChannel) {
        return res.status(409).json({
          error: 'Channel name taken',
          message: 'A channel with this name already exists in this NSC'
        });
      }
    }

    // Create group channel
    const result = await prisma.$transaction(async (tx) => {
      const channel = await tx.channel.create({
        data: {
          name: name || null,
          description: description || null,
          type: 'GROUP',
          nscId,
          createdBy: currentUserId
        }
      });

      // Add all members (including creator)
      const allMemberIds = [currentUserId, ...memberIds.filter(id => id !== currentUserId)];
      await tx.channelMember.createMany({
        data: allMemberIds.map(userId => ({
          channelId: channel.id,
          userId
        }))
      });

      return channel;
    });

    // Fetch the complete channel with members
    const channelWithMembers = await prisma.channel.findFirst({
      where: { id: result.id },
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

    res.status(201).json({
      message: 'Group channel created successfully',
      channel: {
        id: channelWithMembers.id,
        name: channelWithMembers.name,
        description: channelWithMembers.description,
        type: channelWithMembers.type,
        createdAt: channelWithMembers.createdAt,
        memberCount: channelWithMembers.members.length,
        members: channelWithMembers.members.map(member => ({
          userId: member.user.id,
          username: member.user.username,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          joinedAt: member.joinedAt
        }))
      }
    });

  } catch (error) {
    next(error);
  }
});

// Join channel
router.post('/:nscId/:channelId/join', requireNSCAccess, async (req, res, next) => {
  try {
    const { nscId, channelId } = req.params;

    // Check if channel exists and is accessible
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
        message: 'Channel not found or not accessible'
      });
    }

    if (channel.type === 'PRIVATE') {
      return res.status(403).json({
        error: 'Cannot join private channel',
        message: 'Private channels require an invitation'
      });
    }

    // Check if already a member
    const existingMembership = await prisma.channelMember.findFirst({
      where: {
        channelId,
        userId: req.user.id
      }
    });

    if (existingMembership) {
      if (existingMembership.isActive) {
        return res.status(409).json({
          error: 'Already a member',
          message: 'You are already a member of this channel'
        });
      } else {
        // Reactivate membership
        await prisma.channelMember.update({
          where: { id: existingMembership.id },
          data: { isActive: true }
        });
      }
    } else {
      // Create new membership
      await prisma.channelMember.create({
        data: {
          channelId,
          userId: req.user.id
        }
      });
    }

    res.json({
      message: 'Successfully joined channel'
    });

  } catch (error) {
    next(error);
  }
});

// Leave channel
router.post('/:nscId/:channelId/leave', requireNSCAccess, async (req, res, next) => {
  try {
    const { nscId, channelId } = req.params;

    // Cannot leave general channel
    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        nscId,
        isActive: true
      }
    });

    if (!channel) {
      return res.status(404).json({
        error: 'Channel not found'
      });
    }

    if (channel.name === 'general') {
      return res.status(400).json({
        error: 'Cannot leave general channel',
        message: 'You cannot leave the general channel'
      });
    }

    // Prevent leaving DIRECT channels (they should be hidden instead)
    if (channel.type === 'DIRECT_MESSAGE') {
      return res.status(400).json({
        error: 'Cannot leave direct message',
        message: 'Direct messages cannot be left. They can only be archived or hidden.'
      });
    }

    // Remove membership
    await prisma.channelMember.updateMany({
      where: {
        channelId,
        userId: req.user.id
      },
      data: { isActive: false }
    });

    res.json({
      message: 'Successfully left channel'
    });

  } catch (error) {
    next(error);
  }
});

// Archive/hide direct message (alternative to leaving for DIRECT channels)
router.post('/:nscId/:channelId/archive', requireNSCAccess, async (req, res, next) => {
  try {
    const { nscId, channelId } = req.params;

    // Verify this is a DIRECT channel that the user is a member of
    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        nscId,
        type: 'DIRECT_MESSAGE',
        isActive: true,
        members: {
          some: {
            userId: req.user.id,
            isActive: true
          }
        }
      }
    });

    if (!channel) {
      return res.status(404).json({
        error: 'Direct message not found',
        message: 'Direct message not found or you do not have access to it'
      });
    }

    // Remove user's membership (archive for this user)
    await prisma.channelMember.updateMany({
      where: {
        channelId,
        userId: req.user.id
      },
      data: { isActive: false }
    });

    res.json({
      message: 'Direct message archived successfully'
    });

  } catch (error) {
    next(error);
  }
});

// Add member to channel (admin or channel creator)
router.post('/:nscId/:channelId/members', [
  requireNSCAccess,
  body('userId').isUUID()
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
    const { userId } = req.body;

    // Check if user has permission to add members
    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        nscId,
        isActive: true
      }
    });

    if (!channel) {
      return res.status(404).json({
        error: 'Channel not found'
      });
    }

    // Check permissions
    const hasPermission = req.nscMembership.role.permissions.includes('admin') ||
                         req.nscMembership.role.permissions.includes('manage_channels') ||
                         channel.createdBy === req.user.id;

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'You do not have permission to add members to this channel'
      });
    }

    // Prevent adding members to DIRECT_MESSAGE channels
    if (channel.type === 'DIRECT_MESSAGE') {
      return res.status(400).json({
        error: 'Cannot add members to direct message',
        message: 'Direct messages can only have two participants'
      });
    }

    // Check if target user exists and has access to NSC
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        nscMemberships: {
          some: {
            nscId,
            isActive: true
          }
        }
      }
    });

    if (!targetUser) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found or does not have access to this NSC'
      });
    }

    // Add or reactivate membership
    await prisma.channelMember.upsert({
      where: {
        channelId_userId: {
          channelId,
          userId
        }
      },
      update: { isActive: true },
      create: {
        channelId,
        userId
      }
    });

    res.json({
      message: 'User added to channel successfully'
    });

  } catch (error) {
    next(error);
  }
});

// Update channel
router.put('/:nscId/:channelId', [
  requireNSCAccess,
  body('name').optional().isLength({ min: 1, max: 50 }).matches(/^[a-zA-Z0-9_-]+$/),
  body('description').optional().isLength({ max: 500 })
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
    const { name, description } = req.body;

    // Check permissions
    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        nscId,
        isActive: true
      }
    });

    if (!channel) {
      return res.status(404).json({
        error: 'Channel not found'
      });
    }

    const hasPermission = req.nscMembership.role.permissions.includes('admin') ||
                         req.nscMembership.role.permissions.includes('manage_channels') ||
                         channel.createdBy === req.user.id;

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const updateData = {};
    if (name && name !== channel.name) {
      // Check if new name already exists
      const existingChannel = await prisma.channel.findFirst({
        where: {
          name,
          nscId,
          id: { not: channelId },
          isActive: true
        }
      });

      if (existingChannel) {
        return res.status(409).json({
          error: 'Channel name taken',
          message: 'A channel with this name already exists'
        });
      }
      updateData.name = name;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    const updatedChannel = await prisma.channel.update({
      where: { id: channelId },
      data: updateData
    });

    res.json({
      message: 'Channel updated successfully',
      channel: updatedChannel
    });

  } catch (error) {
    next(error);
  }
});

// Delete channel (admin only)
router.delete('/:nscId/:channelId', [
  requireNSCAccess,
  requireRole(['admin', 'manage_channels'])
], async (req, res, next) => {
  try {
    const { nscId, channelId } = req.params;

    const channel = await prisma.channel.findFirst({
      where: {
        id: channelId,
        nscId,
        isActive: true
      }
    });

    if (!channel) {
      return res.status(404).json({
        error: 'Channel not found'
      });
    }

    if (channel.name === 'general') {
      return res.status(400).json({
        error: 'Cannot delete general channel',
        message: 'The general channel cannot be deleted'
      });
    }

    await prisma.channel.update({
      where: { id: channelId },
      data: { isActive: false }
    });

    res.json({
      message: 'Channel deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
