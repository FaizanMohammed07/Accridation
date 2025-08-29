const Log = require('../models/logModel');

class Logger {
  static async log(action, user, req, additionalData = {}) {
    try {
      const logData = {
        user: user?._id || user,
        action,
        category: this.getCategoryFromAction(action),
        severity: this.getSeverityFromAction(action),
        details: additionalData,
        metadata: {
          ip: this.getClientIP(req),
          userAgent: req?.get('User-Agent') || 'Unknown',
          device: this.getDeviceType(req?.get('User-Agent')),
          browser: this.getBrowser(req?.get('User-Agent')),
          os: this.getOS(req?.get('User-Agent'))
        },
        sessionId: req?.sessionId || req?.headers['x-session-id'],
        correlationId: req?.headers['x-correlation-id'] || this.generateCorrelationId()
      };

      if (additionalData.targetResource) {
        logData.targetResource = additionalData.targetResource;
      }

      if (additionalData.status) {
        logData.status = additionalData.status;
      }

      if (additionalData.error) {
        logData.errorInfo = {
          message: additionalData.error.message,
          stack: additionalData.error.stack,
          code: additionalData.error.code
        };
        logData.status = 'failure';
      }

      await Log.createLog(logData);
    } catch (error) {
      console.error('Failed to create log entry:', error);
    }
  }

  static getCategoryFromAction(action) {
    const categoryMap = {
      'login': 'authentication',
      'logout': 'authentication',
      'login_failed': 'authentication',
      'password_reset': 'authentication',
      'password_changed': 'authentication',
      'document_uploaded': 'document',
      'document_updated': 'document',
      'document_deleted': 'document',
      'document_downloaded': 'document',
      'reviewer_assigned': 'admin',
      'auditor_assigned': 'admin',
      'assignment_removed': 'admin',
      'review_started': 'review',
      'review_updated': 'review',
      'review_submitted': 'review',
      'audit_started': 'audit',
      'audit_updated': 'audit',
      'audit_completed': 'audit',
      'institute_created': 'admin',
      'institute_updated': 'admin',
      'institute_status_changed': 'admin',
      'user_created': 'admin',
      'user_updated': 'admin',
      'user_status_changed': 'admin',
      'user_role_changed': 'admin',
      'account_locked': 'security',
      'account_unlocked': 'security',
      'security_alert': 'security'
    };
    
    return categoryMap[action] || 'system';
  }

  static getSeverityFromAction(action) {
    const severityMap = {
      'login_failed': 'high',
      'account_locked': 'critical',
      'security_alert': 'critical',
      'password_reset': 'medium',
      'user_role_changed': 'high',
      'document_deleted': 'high',
      'audit_completed': 'medium',
      'review_submitted': 'medium'
    };
    
    return severityMap[action] || 'low';
  }

  static getClientIP(req) {
    return req?.ip || 
           req?.connection?.remoteAddress || 
           req?.socket?.remoteAddress ||
           (req?.connection?.socket ? req.connection.socket.remoteAddress : null) ||
           req?.headers['x-forwarded-for']?.split(',')[0] ||
           req?.headers['x-real-ip'] ||
           'unknown';
  }

  static getDeviceType(userAgent) {
    if (!userAgent) return 'unknown';
    
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }
    return 'desktop';
  }

  static getBrowser(userAgent) {
    if (!userAgent) return 'unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'unknown';
  }

  static getOS(userAgent) {
    if (!userAgent) return 'unknown';
    
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'unknown';
  }

  static generateCorrelationId() {
    return require('crypto').randomBytes(8).toString('hex');
  }

  // Helper methods for common log actions
  static async logAuth(action, user, req, additionalData = {}) {
    return this.log(action, user, req, { ...additionalData, category: 'authentication' });
  }

  static async logDocument(action, user, req, document, additionalData = {}) {
    return this.log(action, user, req, {
      ...additionalData,
      targetResource: {
        type: 'Document',
        id: document._id,
        name: document.title
      }
    });
  }

  static async logAdmin(action, user, req, target, additionalData = {}) {
    return this.log(action, user, req, {
      ...additionalData,
      targetResource: target
    });
  }
}

module.exports = Logger;