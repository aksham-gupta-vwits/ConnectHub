const express = require('express');
const { body, validationResult } = require('express-validator');

const { prisma } = require('../config/database');
const { authenticateToken, requireNSCAccess, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get roles for NSC
router.get('/:nscId', requireNSCAccess, async (req, res, next) => {
  try {
    const { nscId } = req.params;

    const roles = await prisma.role.findMany({
      where: {
        nscId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            userNSCs: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        userCount: role._count.userNSCs,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt
      }))
    });

  } catch (error) {
    next(error);
  }
});

// Get available permissions - must be defined BEFORE /:nscId/:roleId to avoid route conflict
router.get('/:nscId/permissions', requireNSCAccess, async (req, res, next) => {
  try {
    const permissions = [
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full administrative access to all features'
      },
      {
        id: 'manage_users',
        name: 'Manage Users',
        description: 'Add, remove, and modify user accounts and roles'
      },
      {
        id: 'manage_channels',
        name: 'Manage Channels',
        description: 'Create, modify, and delete channels'
      },
      {
        id: 'manage_roles',
        name: 'Manage Roles',
        description: 'Create, modify, and delete user roles'
      },
      {
        id: 'read_channels',
        name: 'Read Channels',
        description: 'View and read messages in channels'
      },
      {
        id: 'send_messages',
        name: 'Send Messages',
        description: 'Send messages in channels'
      },
      {
        id: 'join_public_channels',
        name: 'Join Public Channels',
        description: 'Join public channels without invitation'
      },
      {
        id: 'create_channels',
        name: 'Create Channels',
        description: 'Create new channels'
      },
      {
        id: 'delete_messages',
        name: 'Delete Messages',
        description: 'Delete messages from other users'
      },
      {
        id: 'invite_users',
        name: 'Invite Users',
        description: 'Send invitations to external users'
      }
    ];

    res.json({
      permissions
    });

  } catch (error) {
    next(error);
  }
});

// Get specific role details
router.get('/:nscId/:roleId', [
  requireNSCAccess,
  requireRole(['admin', 'manage_roles'])
], async (req, res, next) => {
  try {
    const { nscId, roleId } = req.params;

    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        nscId,
        isActive: true
      },
      include: {
        userNSCs: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            userNSCs: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    if (!role) {
      return res.status(404).json({
        error: 'Role not found',
        message: 'Role not found in this NSC'
      });
    }

    res.json({
      role: {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        userCount: role._count.userNSCs,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        users: role.userNSCs.map(userNSC => ({
          ...userNSC.user,
          joinedAt: userNSC.joinedAt
        }))
      }
    });

  } catch (error) {
    next(error);
  }
});

// Create new role
router.post('/:nscId', [
  requireNSCAccess,
  requireRole(['admin', 'manage_roles']),
  body('name').isLength({ min: 1, max: 50 }).trim(),
  body('description').optional().isLength({ max: 500 }),
  body('permissions').isArray().custom(permissions => {
    const validPermissions = [
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
    ];
    
    return permissions.every(permission => validPermissions.includes(permission));
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
    const { name, description, permissions } = req.body;

    // Check if role name already exists in this NSC
    const existingRole = await prisma.role.findFirst({
      where: {
        name,
        nscId,
        isActive: true
      }
    });

    if (existingRole) {
      return res.status(409).json({
        error: 'Role already exists',
        message: 'A role with this name already exists in this NSC'
      });
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions,
        nscId
      }
    });

    res.status(201).json({
      message: 'Role created successfully',
      role
    });

  } catch (error) {
    next(error);
  }
});

// Update role
router.put('/:nscId/:roleId', [
  requireNSCAccess,
  requireRole(['admin', 'manage_roles']),
  body('name').optional().isLength({ min: 1, max: 50 }).trim(),
  body('description').optional().isLength({ max: 500 }),
  body('permissions').optional().isArray().custom(permissions => {
    const validPermissions = [
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
    ];
    
    return permissions.every(permission => validPermissions.includes(permission));
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

    const { nscId, roleId } = req.params;
    const { name, description, permissions } = req.body;

    // Check if role exists
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
        message: 'Role not found in this NSC'
      });
    }

    // Cannot modify default Admin role to prevent lockout
    if (role.name === 'Admin' && name && name !== 'Admin') {
      return res.status(400).json({
        error: 'Cannot rename Admin role',
        message: 'The Admin role cannot be renamed'
      });
    }

    const updateData = {};
    
    if (name && name !== role.name) {
      // Check if new name already exists
      const existingRole = await prisma.role.findFirst({
        where: {
          name,
          nscId,
          id: { not: roleId },
          isActive: true
        }
      });

      if (existingRole) {
        return res.status(409).json({
          error: 'Role name taken',
          message: 'A role with this name already exists'
        });
      }
      updateData.name = name;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (permissions) {
      // Ensure Admin role always has admin permission
      if (role.name === 'Admin' && !permissions.includes('admin')) {
        return res.status(400).json({
          error: 'Admin role must have admin permission',
          message: 'The Admin role must retain the admin permission'
        });
      }
      updateData.permissions = permissions;
    }

    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: updateData
    });

    res.json({
      message: 'Role updated successfully',
      role: updatedRole
    });

  } catch (error) {
    next(error);
  }
});

// Delete role
router.delete('/:nscId/:roleId', [
  requireNSCAccess,
  requireRole(['admin', 'manage_roles'])
], async (req, res, next) => {
  try {
    const { nscId, roleId } = req.params;

    // Check if role exists
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        nscId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            userNSCs: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    if (!role) {
      return res.status(404).json({
        error: 'Role not found',
        message: 'Role not found in this NSC'
      });
    }

    // Cannot delete default roles
    if (['Admin', 'Member'].includes(role.name)) {
      return res.status(400).json({
        error: 'Cannot delete default role',
        message: 'Default roles (Admin, Member) cannot be deleted'
      });
    }

    // Cannot delete role if users are assigned to it
    if (role._count.userNSCs > 0) {
      return res.status(400).json({
        error: 'Role in use',
        message: 'Cannot delete role that is assigned to users',
        assignedUsers: role._count.userNSCs
      });
    }

    await prisma.role.update({
      where: { id: roleId },
      data: { isActive: false }
    });

    res.json({
      message: 'Role deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// Assign role to user
router.post('/:nscId/:roleId/assign', [
  requireNSCAccess,
  requireRole(['admin', 'manage_users']),
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

    const { nscId, roleId } = req.params;
    const { userId } = req.body;

    // Verify role exists
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
        message: 'Role not found in this NSC'
      });
    }

    // Verify user exists and has access to NSC
    const userNSC = await prisma.userNSC.findFirst({
      where: {
        userId,
        nscId,
        isActive: true
      },
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
    });

    if (!userNSC) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found or does not have access to this NSC'
      });
    }

    // Update user role
    const updatedMembership = await prisma.userNSC.update({
      where: { id: userNSC.id },
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
      message: 'Role assigned successfully',
      membership: updatedMembership
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
