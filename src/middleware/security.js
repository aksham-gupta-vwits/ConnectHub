// Security middleware for protecting the API
const securityMiddleware = (req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // More relaxed CSP for test pages, strict for API
  if (req.path.includes('/simple-chat') || req.path.includes('/test-chat') || req.path.startsWith('/public/')) {
    res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  } else {
    res.setHeader('Content-Security-Policy', "default-src 'self'");
  }
  
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

module.exports = { securityMiddleware };
