const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');

const { prisma } = require('../config/database');
const { authRateLimiter } = require('../middleware/rateLimiter');
const { authenticateToken, requireNSCAccess, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authRateLimiter);

// Validation middleware
const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 30 }),
  body('firstName').isLength({ min: 1, max: 50 }).trim(),
  body('lastName').isLength({ min: 1, max: 50 }).trim(),
  body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/)
    .withMessage('Password must be 8–128 characters and include uppercase, lowercase, number, and special character (@$!%*?&)'),
  body('nscId').isUUID()
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Register new user (form-based)
router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Please check your input data',
        details: errors.array()
      });
    }

    const { email, username, firstName, lastName, password, nscId, invitationToken } = req.body;

    // Check for existing user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email or username already exists'
      });
    }

    // Verify invitation if provided
    let invitation = null;
    if (invitationToken) {
      invitation = await prisma.invitation.findUnique({
        where: { token: invitationToken },
        include: { nsc: true }
      });

      if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
        return res.status(400).json({
          error: 'Invalid invitation',
          message: 'The invitation token is invalid or has expired'
        });
      }

      if (invitation.email !== email) {
        return res.status(400).json({
          error: 'Email mismatch',
          message: 'The email does not match the invitation'
        });
      }
    } else {
      // Check if NSC exists and allows open registration
      const nsc = await prisma.nSC.findUnique({ where: { id: nscId } });
      if (!nsc || !nsc.isActive) {
        return res.status(400).json({
          error: 'Invalid NSC',
          message: 'The specified NSC does not exist or is inactive'
        });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user and NSC membership in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          username,
          firstName,
          lastName,
          passwordHash,
          authProvider: 'form'
        }
      });

      // Get default role for the NSC
      let defaultRole = await tx.role.findFirst({
        where: {
          nscId: invitation ? invitation.nscId : nscId,
          name: 'Member'
        }
      });

      // Create default role if it doesn't exist
      if (!defaultRole) {
        defaultRole = await tx.role.create({
          data: {
            name: 'Member',
            description: 'Default member role',
            nscId: invitation ? invitation.nscId : nscId,
            permissions: ['read_channels', 'send_messages', 'join_public_channels']
          }
        });
      }

      // Create NSC membership
      await tx.userNSC.create({
        data: {
          userId: user.id,
          nscId: invitation ? invitation.nscId : nscId,
          roleId: invitation?.roleId || defaultRole.id,
          status: invitation ? 'ACTIVE' : 'PENDING_APPROVAL' // Set membership as pending if no invitation
        }
      });

      // Update invitation status if used
      if (invitation) {
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: 'ACCEPTED' }
        });
      }

      return user;
    });

    res.status(201).json({
      message: invitation ? 'User registered successfully' : 'Registration submitted successfully. Please wait for admin approval.',
      user: {
        id: result.id,
        email: result.email,
        username: result.username,
        firstName: result.firstName,
        lastName: result.lastName
      },
      needsApproval: !invitation
    });

  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user with NSC memberships
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        nscMemberships: {
          include: {
            nsc: true,
            role: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid credentials or inactive account'
      });
    }

    // Check if user has any active NSC memberships
    const activeMemberships = user.nscMemberships.filter(membership => 
      membership.isActive && membership.status === 'ACTIVE'
    );

    if (activeMemberships.length === 0) {
      const pendingMemberships = user.nscMemberships.filter(membership =>
        membership.status === 'PENDING_APPROVAL'
      );
      
      if (pendingMemberships.length > 0) {
        return res.status(403).json({
          error: 'Account pending approval',
          message: 'Your account is pending admin approval. Please contact your administrator.'
        });
      } else {
        return res.status(401).json({
          error: 'No access',
          message: 'You do not have access to any NSCs. Please contact your administrator.'
        });
      }
    }

    // Verify password (only for form-based auth)
    if (user.authProvider === 'form') {
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid credentials'
        });
      }
    } else {
      return res.status(400).json({
        error: 'Authentication method not supported',
        message: 'This account uses a different authentication method'
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        authProvider: user.authProvider
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        nscMemberships: activeMemberships.map(membership => ({
          nscId: membership.nscId,
          nscName: membership.nsc.name,
          role: membership.role.name,
          permissions: membership.role.permissions
        }))
      }
    });

  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token required',
        message: 'Refresh token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch updated user data
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
      return res.status(401).json({
        error: 'Invalid user',
        message: 'User not found or inactive'
      });
    }

    // Generate new token
    const newToken = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        authProvider: user.authProvider
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Token refreshed successfully',
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        nscMemberships: user.nscMemberships.map(membership => ({
          nscId: membership.nscId,
          nscName: membership.nsc.name,
          role: membership.role.name,
          permissions: membership.role.permissions
        }))
      }
    });

  } catch (error) {
    next(error);
  }
});

// Admin approval routes (require authentication and admin role)
// Admin check middleware specifically for auth routes
const requireAdminRole = (req, res, next) => {
  try {
    if (!req.nscMembership) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'NSC membership required',
        code: 'NSC_MEMBERSHIP_REQUIRED'
      });
    }

    const userRole = req.nscMembership.role.name;
    
    // Check if user has admin role
    if (userRole?.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin role required',
        code: 'ADMIN_ROLE_REQUIRED',
        userRole
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Get pending user approvals for NSC (admin only)
router.get('/pending-approvals/:nscId', [
  authenticateToken,
  requireNSCAccess,
  requireAdminRole
], async (req, res, next) => {
  try {
    const { nscId } = req.params;

    const pendingUsers = await prisma.userNSC.findMany({
      where: {
        nscId,
        status: 'PENDING_APPROVAL'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        joinedAt: 'asc'
      }
    });

    res.json({
      pendingUsers: pendingUsers.map(membership => ({
        ...membership.user,
        membershipId: membership.id,
        requestedAt: membership.joinedAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Approve/Reject user (admin only)
router.post('/approve-user/:nscId/:userId', [
  authenticateToken,
  requireNSCAccess,
  requireAdminRole,
  body('action').isIn(['approve', 'reject']),
  body('reason').optional().isLength({ max: 500 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { nscId, userId } = req.params;
    const { action, reason } = req.body;

    await prisma.$transaction(async (tx) => {
      if (action === 'approve') {
        // Update membership status to active
        await tx.userNSC.updateMany({
          where: {
            userId,
            nscId,
            status: 'PENDING_APPROVAL'
          },
          data: { status: 'ACTIVE' }
        });
      } else {
        // Reject user - remove pending membership
        await tx.userNSC.deleteMany({
          where: {
            userId,
            nscId,
            status: 'PENDING_APPROVAL'
          }
        });
      }
    });

    res.json({
      message: `User ${action}d successfully`,
      action
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
