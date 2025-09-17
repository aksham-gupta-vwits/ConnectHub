// // Simple rate limiting implementation
// const requestCounts = new Map();

// // Simple rate limiting function
// const rateLimiter = (req, res, next) => {
//   const ip = req.ip || req.connection.remoteAddress;
//   const now = Date.now();
//   const windowMs = 15 * 60 * 1000; // 15 minutes
//   const maxRequests = 100;

//   // Clean old entries
//   for (const [key, data] of requestCounts.entries()) {
//     if (now - data.resetTime > windowMs) {
//       requestCounts.delete(key);
//     }
//   }

//   // Get or create request data for this IP
//   if (!requestCounts.has(ip)) {
//     requestCounts.set(ip, {
//       count: 0,
//       resetTime: now
//     });
//   }

//   const requestData = requestCounts.get(ip);

//   // Reset count if window has passed
//   if (now - requestData.resetTime > windowMs) {
//     requestData.count = 0;
//     requestData.resetTime = now;
//   }

//   // Skip rate limiting for health checks
//   if (req.path === '/health') {
//     return next();
//   }

//   // Check if limit exceeded
//   if (requestData.count >= maxRequests) {
//     return res.status(429).json({
//       error: 'Too many requests from this IP, please try again later.',
//       retryAfter: '15 minutes'
//     });
//   }

//   // Increment count
//   requestData.count++;

//   // Set rate limit headers
//   res.setHeader('X-RateLimit-Limit', maxRequests);
//   res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestData.count));
//   res.setHeader('X-RateLimit-Reset', new Date(requestData.resetTime + windowMs).toISOString());

//   next();
// };

// // Stricter rate limiting for auth endpoints
// const authRateLimiter = (req, res, next) => {
//   const ip = req.ip || req.connection.remoteAddress;
//   const now = Date.now();
//   const windowMs = 15 * 60 * 1000; // 15 minutes
//   const maxRequests = 5;
//   const key = `auth_${ip}`;

//   // Clean old entries
//   for (const [entryKey, data] of requestCounts.entries()) {
//     if (entryKey.startsWith('auth_') && now - data.resetTime > windowMs) {
//       requestCounts.delete(entryKey);
//     }
//   }

//   // Get or create request data for this IP
//   if (!requestCounts.has(key)) {
//     requestCounts.set(key, {
//       count: 0,
//       resetTime: now
//     });
//   }

//   const requestData = requestCounts.get(key);

//   // Reset count if window has passed
//   if (now - requestData.resetTime > windowMs) {
//     requestData.count = 0;
//     requestData.resetTime = now;
//   }

//   // Check if limit exceeded
//   if (requestData.count >= maxRequests) {
//     return res.status(429).json({
//       error: 'Too many authentication attempts, please try again later.',
//       retryAfter: '15 minutes'
//     });
//   }

//   // Increment count
//   requestData.count++;

//   // Set rate limit headers
//   res.setHeader('X-RateLimit-Limit', maxRequests);
//   res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestData.count));
//   res.setHeader('X-RateLimit-Reset', new Date(requestData.resetTime + windowMs).toISOString());

//   next();
// };

// module.exports = { rateLimiter, authRateLimiter };
