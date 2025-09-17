const express = require('express');
const { body, validationResult } = require('express-validator');

const { prisma } = require('../config/database');
const { authenticateToken, requireNSCAccess, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public route to get available NSCs for signup (before auth middleware)
router.get('/available', async (req, res, next) => {
  try {
    const nscs = await prisma.nSC.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        region: true,
        subdomain: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      nscs
    });
  } catch (error) {
    console.error('Failed to fetch available NSCs:', error);
    next(error);
  }
});

// Apply authentication to all other routes
router.use(authenticateToken);

// Get all NSCs user has access to
router.get('/', async (req, res, next) => {
  try {
    const userNSCs = await prisma.userNSC.findMany({
      where: {
        userId: req.user.id,
        isActive: true
      },
      include: {
        nsc: {
          select: {
            id: true,
            name: true,
            region: true,
            subdomain: true,
            isActive: true,
            createdAt: true
          }
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: true
          }
        }
      }
    });

    res.json({
      nscs: userNSCs.map(membership => ({
        ...membership.nsc,
        membership: {
          roleId: membership.roleId,
          role: membership.role,
          joinedAt: membership.joinedAt
        }
      }))
    });

  } catch (error) {
    next(error);
  }
});

// Get specific NSC details
router.get('/:nscId', requireNSCAccess, async (req, res, next) => {
  try {
    const { nscId } = req.params;

    const nsc = await prisma.nSC.findUnique({
      where: { id: nscId },
      include: {
        _count: {
          select: {
            users: {
              where: { isActive: true }
            },
            channels: {
              where: { isActive: true }
            },
            roles: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    if (!nsc) {
      return res.status(404).json({
        error: 'NSC not found',
        message: 'The specified NSC does not exist'
      });
    }

    res.json({
      nsc: {
        id: nsc.id,
        name: nsc.name,
        region: nsc.region,
        subdomain: nsc.subdomain,
        isActive: nsc.isActive,
        createdAt: nsc.createdAt,
        updatedAt: nsc.updatedAt,
        stats: {
          userCount: nsc._count.users,
          channelCount: nsc._count.channels,
          roleCount: nsc._count.roles
        },
        userMembership: req.nscMembership
      }
    });

  } catch (error) {
    next(error);
  }
});

// Create new NSC (super admin only - this would typically be restricted)
router.post('/', [
  body('name').isLength({ min: 2, max: 100 }).trim(),
  body('region').optional().isLength({ min: 2, max: 50 }),
  body('subdomain').isLength({ min: 2, max: 50 }).matches(/^[a-z0-9-]+$/)
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // This should typically be restricted to super admins
    // For now, we'll allow any authenticated user to create NSCs for demo purposes
    const { name, region = 'APAC', subdomain } = req.body;

    // Check if subdomain is already taken
    const existingNSC = await prisma.nSC.findFirst({
      where: {
        OR: [
          { name },
          { subdomain }
        ]
      }
    });

    if (existingNSC) {
      return res.status(409).json({
        error: 'NSC already exists',
        message: 'An NSC with this name or subdomain already exists'
      });
    }

    // Create NSC and make creator an admin
    const result = await prisma.$transaction(async (tx) => {
      // Create NSC
      const nsc = await tx.nSC.create({
        data: {
          name,
          region,
          subdomain
        }
      });

      // Create default roles
      const adminRole = await tx.role.create({
        data: {
          name: 'Admin',
          description: 'Full administrative access',
          nscId: nsc.id,
          permissions: [
            'admin',
            'manage_users',
            'manage_channels',
            'manage_roles',
            'read_channels',
            'send_messages',
            'join_public_channels',
            'create_channels',
            'delete_messages',
            'invite_users'
          ]
        }
      });

      const memberRole = await tx.role.create({
        data: {
          name: 'Member',
          description: 'Default member access',
          nscId: nsc.id,
          permissions: [
            'read_channels',
            'send_messages',
            'join_public_channels'
          ]
        }
      });

      // Make creator an admin
      await tx.userNSC.create({
        data: {
          userId: req.user.id,
          nscId: nsc.id,
          roleId: adminRole.id
        }
      });

      // Create general channel
      await tx.channel.create({
        data: {
          name: 'general',
          description: 'General discussion channel',
          nscId: nsc.id,
          type: 'PUBLIC',
          createdBy: req.user.id
        }
      });

      return { nsc, adminRole, memberRole };
    });

    res.status(201).json({
      message: 'NSC created successfully',
      nsc: result.nsc,
      roles: [result.adminRole, result.memberRole]
    });

  } catch (error) {
    next(error);
  }
});

// Update NSC (admin only)
router.put('/:nscId', [
  requireNSCAccess,
  requireRole(['admin']),
  body('name').optional().isLength({ min: 2, max: 100 }).trim(),
  body('subdomain').optional().isLength({ min: 2, max: 50 }).matches(/^[a-z0-9-]+$/)
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
    const { name, subdomain } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (subdomain) {
      // Check if subdomain is already taken by another NSC
      const existingNSC = await prisma.nSC.findFirst({
        where: {
          subdomain,
          id: { not: nscId }
        }
      });

      if (existingNSC) {
        return res.status(409).json({
          error: 'Subdomain taken',
          message: 'This subdomain is already in use'
        });
      }
      updateData.subdomain = subdomain;
    }

    const updatedNSC = await prisma.nSC.update({
      where: { id: nscId },
      data: updateData
    });

    res.json({
      message: 'NSC updated successfully',
      nsc: updatedNSC
    });

  } catch (error) {
    next(error);
  }
});

// Get NSC statistics (admin only)
router.get('/:nscId/stats', [
  requireNSCAccess,
  requireRole(['admin', 'manage_users'])
], async (req, res, next) => {
  try {
    const { nscId } = req.params;

    const stats = await prisma.nSC.findUnique({
      where: { id: nscId },
      include: {
        _count: {
          select: {
            users: {
              where: { isActive: true }
            },
            channels: {
              where: { isActive: true }
            },
            roles: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    // Get message count for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const messageStats = await prisma.message.groupBy({
      by: ['createdAt'],
      where: {
        channel: { nscId },
        createdAt: { gte: thirtyDaysAgo }
      },
      _count: true
    });

    // Get active users (users who sent messages in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsers = await prisma.user.count({
      where: {
        sentMessages: {
          some: {
            channel: { nscId },
            createdAt: { gte: sevenDaysAgo }
          }
        }
      }
    });

    res.json({
      stats: {
        totalUsers: stats._count.users,
        totalChannels: stats._count.channels,
        totalRoles: stats._count.roles,
        activeUsersLast7Days: activeUsers,
        messagesLast30Days: messageStats.reduce((sum, day) => sum + day._count, 0)
      }
    });

  } catch (error) {
    next(error);
  }
});

// Deactivate NSC (super admin only)
router.put('/:nscId/deactivate', [
  requireNSCAccess,
  requireRole(['admin'])
], async (req, res, next) => {
  try {
    const { nscId } = req.params;

    await prisma.nSC.update({
      where: { id: nscId },
      data: { isActive: false }
    });

    res.json({
      message: 'NSC deactivated successfully'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
