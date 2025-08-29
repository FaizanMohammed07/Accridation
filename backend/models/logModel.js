const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please link log to user']
  },
  action: {
    type: String,
    required: [true, 'Please specify action'],
    enum: [
      'login', 'logout', 'login_failed', 'password_reset', 'password_changed',
      'document_uploaded', 'document_updated', 'document_deleted', 'document_downloaded',
      'reviewer_assigned', 'auditor_assigned', 'assignment_removed',
      'review_started', 'review_updated', 'review_submitted',
      'audit_started', 'audit_updated', 'audit_completed',
      'institute_created', 'institute_updated', 'institute_status_changed',
      'user_created', 'user_updated', 'user_status_changed', 'user_role_changed',
      'notification_sent', 'report_generated', 'system_backup', 'data_export',
      'security_alert', 'account_locked', 'account_unlocked'
    ]
  },
  category: {
    type: String,
    enum: ['authentication', 'authorization', 'document', 'review', 'audit', 'admin', 'security', 'system'],
    required: [true, 'Please specify log category']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  targetResource: {
    type: {
      type: String,
      enum: ['User', 'Institute', 'Document', 'Review', 'Audit', 'Reviewer', 'Auditor']
    },
    id: mongoose.Schema.Types.ObjectId,
    name: String
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    ip: {
      type: String,
      required: [true, 'Please provide IP address']
    },
    userAgent: {
      type: String,
      required: [true, 'Please provide user agent']
    },
    location: {
      country: String,
      region: String,
      city: String
    },
    device: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown'
    },
    browser: String,
    os: String
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'warning', 'info'],
    default: 'success'
  },
  errorInfo: {
    message: String,
    stack: String,
    code: String
  },
  duration: {
    type: Number, // in milliseconds
    default: 0
  },
  sessionId: String,
  correlationId: String,
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted timestamp
logSchema.virtual('formattedTimestamp').get(function() {
  return this.createdAt.toLocaleString();
});

// Virtual for time ago
logSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Static method to create log entry
logSchema.statics.createLog = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    
    // Also add to user's personal log if user exists
    if (logData.user) {
      const User = mongoose.model('User');
      await User.findByIdAndUpdate(logData.user, {
        $push: {
          logs: {
            action: logData.action,
            timestamp: logData.createdAt || new Date(),
            ip: logData.metadata.ip,
            userAgent: logData.metadata.userAgent,
            details: logData.details
          }
        }
      });
    }
    
    return log;
  } catch (error) {
    console.error('Failed to create log:', error);
    return null;
  }
};

// Index for efficient queries and performance
logSchema.index({ user: 1, createdAt: -1 });
logSchema.index({ action: 1, createdAt: -1 });
logSchema.index({ category: 1, createdAt: -1 });
logSchema.index({ severity: 1, createdAt: -1 });
logSchema.index({ 'targetResource.type': 1, 'targetResource.id': 1 });
logSchema.index({ 'metadata.ip': 1, createdAt: -1 });
logSchema.index({ status: 1, createdAt: -1 });
logSchema.index({ sessionId: 1 });

// TTL index to automatically delete logs older than 2 years
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 });

module.exports = mongoose.model('Log', logSchema);