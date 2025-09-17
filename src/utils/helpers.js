const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a secure JWT token
 * @param {Object} payload - The payload to include in the token
 * @param {String} expiresIn - Token expiration time
 * @returns {String} JWT token
 */
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '24h') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Verify and decode JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Hash password using bcrypt
 * @param {String} password - Plain text password
 * @returns {String} Hashed password
 */
const hashPassword = async (password) => {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  return bcrypt.hash(password, rounds);
};

/**
 * Compare password with hash
 * @param {String} password - Plain text password
 * @param {String} hash - Hashed password
 * @returns {Boolean} Match result
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate invitation token
 * @returns {String} Unique invitation token
 */
const generateInvitationToken = () => {
  return uuidv4() + '-' + Date.now().toString(36);
};

/**
 * Sanitize user input by removing potentially harmful characters
 * @param {String} input - User input to sanitize
 * @returns {String} Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>\"'%;()&+]/g, '') // Remove potentially harmful characters
    .substring(0, 1000); // Limit length
};

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Boolean} Valid email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {String} password - Password to validate
 * @returns {Object} Validation result with details
 */
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const isValid = password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  
  return {
    isValid,
    errors: [
      ...(password.length < minLength ? [`Password must be at least ${minLength} characters long`] : []),
      ...(!hasUpperCase ? ['Password must contain at least one uppercase letter'] : []),
      ...(!hasLowerCase ? ['Password must contain at least one lowercase letter'] : []),
      ...(!hasNumbers ? ['Password must contain at least one number'] : []),
      ...(!hasSpecialChar ? ['Password must contain at least one special character'] : [])
    ]
  };
};

/**
 * Generate pagination metadata
 * @param {Number} total - Total number of items
 * @param {Number} limit - Items per page
 * @param {Number} offset - Current offset
 * @returns {Object} Pagination metadata
 */
const getPaginationMeta = (total, limit, offset) => {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,
    limit,
    offset,
    currentPage,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};

/**
 * Generate a random alphanumeric string
 * @param {Number} length - Length of the string
 * @returns {String} Random string
 */
const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Format user data for API response (remove sensitive fields)
 * @param {Object} user - User object from database
 * @returns {Object} Sanitized user data
 */
const formatUserForResponse = (user) => {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

/**
 * Check if user has specific permission
 * @param {Array} userPermissions - User's permissions array
 * @param {String} requiredPermission - Required permission
 * @returns {Boolean} Has permission
 */
const hasPermission = (userPermissions, requiredPermission) => {
  return userPermissions.includes('admin') || userPermissions.includes(requiredPermission);
};

/**
 * Create standardized API response
 * @param {Boolean} success - Success status
 * @param {String} message - Response message
 * @param {Object} data - Response data
 * @param {Object} meta - Additional metadata
 * @returns {Object} Standardized response
 */
const createResponse = (success, message, data = null, meta = null) => {
  return {
    success,
    message,
    ...(data && { data }),
    ...(meta && { meta }),
    timestamp: new Date().toISOString()
  };
};

/**
 * Log security events
 * @param {String} event - Event type
 * @param {Object} details - Event details
 * @param {String} userId - User ID (optional)
 */
const logSecurityEvent = (event, details, userId = null) => {
  console.log(`🔐 SECURITY EVENT: ${event}`, {
    event,
    details,
    userId,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  generateInvitationToken,
  sanitizeInput,
  validateEmail,
  validatePassword,
  getPaginationMeta,
  generateRandomString,
  formatUserForResponse,
  hasPermission,
  createResponse,
  logSecurityEvent
};
