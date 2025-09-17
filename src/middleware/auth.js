const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// JWT authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user with NSC memberships
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        nscMemberships: {
          include: {
            nsc: true,
            role: true
          },
          where: { isActive: true }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid or inactive user',
        code: 'INVALID_USER'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    next(error);
  }
};

// NSC access middleware - verifies user has access to specific NSC
const requireNSCAccess = (req, res, next) => {
  try {
    const nscId = req.params.nscId || req.body.nscId || req.query.nscId;
    
    if (!nscId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'NSC ID is required',
        code: 'NSC_ID_REQUIRED'
      });
    }

    // Check if user has access to this NSC
    const hasAccess = req.user.nscMemberships.some(
      membership => membership.nscId === nscId && membership.isActive
    );

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have access to this NSC',
        code: 'NSC_ACCESS_DENIED'
      });
    }

    // Add NSC membership info to request
    req.nscMembership = req.user.nscMemberships.find(
      membership => membership.nscId === nscId
    );

    next();
  } catch (error) {
    next(error);
  }
};

// Role-based access control middleware
const requireRole = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      if (!req.nscMembership) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'NSC membership required',
          code: 'NSC_MEMBERSHIP_REQUIRED'
        });
      }

      const userPermissions = req.nscMembership.role.permissions;
      
      // Check if user has required permissions
      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: requiredPermissions,
          userPermissions
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Admin role middleware
const requireAdmin = requireRole(['admin', 'manage_users', 'manage_channels']);

module.exports = {
  authenticateToken,
  requireNSCAccess,
  requireRole,
  requireAdmin
};
