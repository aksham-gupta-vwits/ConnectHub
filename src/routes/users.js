const express = require('express');
const { body, query, validationResult } = require('express-validator');

const { prisma } = require('../config/database');
const { authenticateToken, requireNSCAccess, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get current user profile
router.get('/profile', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        nscMemberships: {
          where: { isActive: true },
          include: {
            nsc: {
              select: {
                id: true,
                name: true,
                region: true,
                subdomain: true
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
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        authProvider: user.authProvider,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        nscMemberships: user.nscMemberships
      }
    });

  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', [
  body('firstName').optional().isLength({ min: 1, max: 50 }).trim(),
  body('lastName').optional().isLength({ min: 1, max: 50 }).trim(),
  body('username').optional().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/)
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { firstName, lastName, username } = req.body;
    const updateData = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (username) {
      // Check if username is already taken
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: req.user.id }
        }
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'Username taken',
          message: 'This username is already in use'
        });
      }
      updateData.username = username;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    next(error);
  }
});

// Search users in NSC
router.get('/search/:nscId', [
  requireNSCAccess,
  query('q').optional().isLength({ min: 1, max: 100 }),
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

    const { nscId } = req.params;
    const { q, limit = 20, offset = 0 } = req.query;

    const whereClause = {
      nscMemberships: {
        some: {
          nscId,
          isActive: true
        }
      },
      isActive: true
    };

    // Add search filter if query provided
    if (q) {
      whereClause.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { username: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          lastLoginAt: true,
          nscMemberships: {
            where: { nscId, isActive: true },
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              }
            }
          }
        },
        skip: offset,
        take: limit,
        orderBy: [
          { firstName: 'asc' },
          { lastName: 'asc' }
        ]
      }),
      prisma.user.count({ where: whereClause })
    ]);

    res.json({
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        lastLoginAt: user.lastLoginAt,
        role: user.nscMemberships[0]?.role
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + limit
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get user details (admin only)
router.get('/:userId/details/:nscId', [
  requireNSCAccess,
  requireRole(['admin', 'manage_users'])
], async (req, res, next) => {
  try {
    const { userId, nscId } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        nscMemberships: {
          some: {
            nscId,
            isActive: true
          }
        }
      },
      include: {
        nscMemberships: {
          where: { nscId },
          include: {
            role: true,
            nsc: {
              select: {
                id: true,
                name: true,
                region: true
              }
            }
          }
        },
        channelMembers: {
          where: {
            channel: { nscId },
            isActive: true
          },
          include: {
            channel: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        },
        _count: {
          select: {
            sentMessages: {
              where: {
                channel: { nscId }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found in this NSC'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        authProvider: user.authProvider,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        nscMembership: user.nscMemberships[0],
        channels: user.channelMembers.map(member => member.channel),
        messageCount: user._count.sentMessages
      }
    });

  } catch (error) {
    next(error);
  }
});

// Update user role (admin only)
router.put('/:userId/role/:nscId', [
  requireNSCAccess,
  requireRole(['admin', 'manage_users']),
  body('roleId').isUUID()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId, nscId } = req.params;
    const { roleId } = req.body;

    // Verify role belongs to this NSC
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        nscId,
        isActive: true
      }
    });

    if (!role) {
      return res.status(404).json({
        error: 'Role not found',
        message: 'The specified role does not exist in this NSC'
      });
    }

    // Update user role
    const updatedMembership = await prisma.userNSC.update({
      where: {
        userId_nscId: {
          userId,
          nscId
        }
      },
      data: { roleId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        role: true
      }
    });

    res.json({
      message: 'User role updated successfully',
      membership: updatedMembership
    });

  } catch (error) {
    next(error);
  }
});

// Deactivate user in NSC (admin only)
router.put('/:userId/deactivate/:nscId', [
  requireNSCAccess,
  requireRole(['admin', 'manage_users'])
], async (req, res, next) => {
  try {
    const { userId, nscId } = req.params;

    // Cannot deactivate yourself
    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Cannot deactivate self',
        message: 'You cannot deactivate your own account'
      });
    }

    await prisma.userNSC.update({
      where: {
        userId_nscId: {
          userId,
          nscId
        }
      },
      data: { isActive: false }
    });

    res.json({
      message: 'User deactivated successfully in this NSC'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
