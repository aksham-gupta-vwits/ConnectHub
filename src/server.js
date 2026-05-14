const express = require('express');
const cors = require('cors');
const http = require('http');
const helmet = require('helmet');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');
const { rateLimiter } = require('./middleware/rateLimiter');
const { securityMiddleware } = require('./middleware/security');
const socketService = require('./services/socketService');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const nscRoutes = require('./routes/nsc');
const channelRoutes = require('./routes/channels');
const messageRoutes = require('./routes/messages');
const roleRoutes = require('./routes/roles');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.IO
socketService.initialize(server);

// Security middleware - helmet first, then custom overrides
app.use(helmet());
app.use(securityMiddleware);
app.use(rateLimiter);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for testing
app.use('/public', express.static('public'));

// Logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test client for real-time messaging
app.get('/test-chat', (req, res) => {
  res.sendFile('chat-test.html', { root: 'public' });
});

// Simple chat test without authentication
app.get('/simple-chat', (req, res) => {
  res.sendFile('simple-chat-test.html', { root: 'public' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/nsc', nscRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/roles', roleRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    // Close database connections here if needed
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 ConnectHub API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket.IO enabled for real-time messaging`);
});

module.exports = app;
