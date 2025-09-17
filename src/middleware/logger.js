// Simple request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log the request
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  
  // Log request body for non-GET requests (excluding sensitive data)
  if (req.method !== 'GET' && req.body) {
    const logBody = { ...req.body };
    // Remove sensitive fields from logs
    delete logBody.password;
    delete logBody.passwordHash;
    delete logBody.token;
    
    if (Object.keys(logBody).length > 0) {
      console.log(`📝 Request body:`, logBody);
    }
  }

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    console.log(`✅ ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    // Call original json method
    return originalJson.call(this, data);
  };

  next();
};

module.exports = { requestLogger };
