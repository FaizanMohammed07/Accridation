const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const asyncHandler = require('../utils/asyncHandler');
const Logger = require('../utils/logger');

const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id)
        .select('-password')
        .populate('logs', null, null, { sort: { timestamp: -1 }, limit: 10 });

      if (!user) {
        await Logger.log('authentication_failed', null, req, {
          reason: 'User not found',
          status: 'failure'
        });
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

      // Check if user account is active
      if (user.status !== 'active') {
        await Logger.log('authentication_failed', user, req, {
          reason: 'Account not active',
          status: 'failure'
        });
        return res.status(401).json({
          success: false,
          message: 'Account is not active'
        });
      }

      // Check if account is locked
      if (user.isLocked) {
        await Logger.log('authentication_failed', user, req, {
          reason: 'Account locked',
          status: 'failure'
        });
        return res.status(401).json({
          success: false,
          message: 'Account is locked due to multiple failed login attempts'
        });
      }

      // Attach user to request
      req.user = user;
      req.sessionId = decoded.sessionId;

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      await Logger.log('authentication_failed', null, req, {
        reason: 'Invalid token',
        error: error.message,
        status: 'failure'
      });

      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  } else {
    await Logger.log('authentication_failed', null, req, {
      reason: 'No token provided',
      status: 'failure'
    });

    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
});

module.exports = authMiddleware;