const asyncHandler = require('../utils/asyncHandler');
const Logger = require('../utils/logger');

const authorize = (...roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      await Logger.log('authorization_failed', null, req, {
        reason: 'No authenticated user',
        requiredRoles: roles,
        status: 'failure'
      });
      
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      await Logger.log('authorization_failed', req.user, req, {
        reason: 'Insufficient permissions',
        userRole: req.user.role,
        requiredRoles: roles,
        status: 'failure'
      });

      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`
      });
    }

    // Log successful authorization
    await Logger.log('authorization_success', req.user, req, {
      userRole: req.user.role,
      requiredRoles: roles,
      status: 'success'
    });

    next();
  });
};

// Helper middleware for specific roles
const adminOnly = authorize('admin');
const instituteOnly = authorize('institute');
const reviewerOnly = authorize('reviewer');
const auditorOnly = authorize('auditor');

// Combined role middlewares
const adminOrInstitute = authorize('admin', 'institute');
const reviewerOrAuditor = authorize('reviewer', 'auditor');
const adminOrReviewer = authorize('admin', 'reviewer');
const adminOrAuditor = authorize('admin', 'auditor');

module.exports = {
  authorize,
  adminOnly,
  instituteOnly,
  reviewerOnly,
  auditorOnly,
  adminOrInstitute,
  reviewerOrAuditor,
  adminOrReviewer,
  adminOrAuditor
};