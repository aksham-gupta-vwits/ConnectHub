const winston = require('winston');

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} [${level}]: ${message}${metaStr}`;
          })
        )
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request body for non-GET requests (excluding sensitive data)
  if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
    const logBody = { ...req.body };
    delete logBody.password;
    delete logBody.passwordHash;
    delete logBody.currentPassword;
    delete logBody.newPassword;
    delete logBody.token;

    if (Object.keys(logBody).length > 0) {
      logger.debug('Request body', { body: logBody });
    }
  }

  // Override res.json to capture response status
  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[logLevel](`${req.method} ${req.path}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
    return originalJson.call(this, data);
  };

  logger.debug(`Incoming ${req.method} ${req.path}`, { ip: req.ip });
  next();
};

module.exports = { requestLogger, logger };
