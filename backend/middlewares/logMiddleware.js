const Logger = require('../utils/logger');
const { generateSessionId } = require('../utils/tokenUtils');

const logMiddleware = (req, res, next) => {
  // Generate session ID if not present
  if (!req.sessionId && !req.headers['x-session-id']) {
    req.sessionId = generateSessionId();
  } else {
    req.sessionId = req.headers['x-session-id'];
  }

  // Store original end method
  const originalEnd = res.end;
  const startTime = Date.now();

  // Override end method to log after response
  res.end = function(chunk, encoding) {
    // Call original end method
    originalEnd.call(this, chunk, encoding);

    // Log the request
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      sessionId: req.sessionId
    };

    // Log API requests (but avoid logging health checks and static files)
    if (!req.originalUrl.includes('/health') && !req.originalUrl.includes('/static')) {
      const action = `api_request_${req.method.toLowerCase()}`;
      Logger.log(action, req.user, req, {
        ...logData,
        category: 'system',
        severity: res.statusCode >= 400 ? 'high' : 'low',
        status: res.statusCode < 400 ? 'success' : 'failure'
      }).catch(err => {
        console.error('Failed to log request:', err);
      });
    }
  };

  next();
};

module.exports = logMiddleware;