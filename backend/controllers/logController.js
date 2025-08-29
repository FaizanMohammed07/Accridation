const Log = require('../models/logModel');
const asyncHandler = require('../utils/asyncHandler');
const Logger = require('../utils/logger');

// @desc    Get system logs
// @route   GET /api/logs
// @access  Private (Admin only)
const getLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  // Build query filters
  let query = {};
  
  if (req.query.category) {
    query.category = req.query.category;
  }
  
  if (req.query.action) {
    query.action = req.query.action;
  }
  
  if (req.query.severity) {
    query.severity = req.query.severity;
  }
  
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  if (req.query.user) {
    query.user = req.query.user;
  }

  // Date range filter
  if (req.query.startDate || req.query.endDate) {
    query.createdAt = {};
    if (req.query.startDate) {
      query.createdAt.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      query.createdAt.$lte = new Date(req.query.endDate);
    }
  }

  // Search across multiple fields
  if (req.query.search) {
    query.$or = [
      { action: { $regex: req.query.search, $options: 'i' } },
      { 'details.reason': { $regex: req.query.search, $options: 'i' } },
      { 'metadata.ip': { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const logs = await Log.find(query)
    .populate('user', 'name email role')
    .populate('targetResource.id')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Log.countDocuments(query);

  // Get log statistics
  const stats = await Log.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);

  await Logger.logAdmin('logs_accessed', req.user, req, {
    filters: query,
    resultCount: logs.length,
    status: 'success'
  });

  res.status(200).json({
    success: true,
    data: {
      logs,
      statistics: stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get user activity logs
// @route   GET /api/logs/user/:userId
// @access  Private (Admin or own logs)
const getUserLogs = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  // Check if user can access these logs
  if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30;
  const skip = (page - 1) * limit;

  let query = { user: userId };

  // Add filters
  if (req.query.category) {
    query.category = req.query.category;
  }
  
  if (req.query.action) {
    query.action = req.query.action;
  }

  // Date range filter
  if (req.query.startDate || req.query.endDate) {
    query.createdAt = {};
    if (req.query.startDate) {
      query.createdAt.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      query.createdAt.$lte = new Date(req.query.endDate);
    }
  }

  const logs = await Log.find(query)
    .populate('user', 'name email role')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Log.countDocuments(query);

  // Get user activity statistics
  const stats = await Log.aggregate([
    { $match: { user: new require('mongoose').Types.ObjectId(userId) } },
    {
      $group: {
        _id: {
          action: '$action',
          status: '$status'
        },
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      logs,
      statistics: stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get activity summary
// @route   GET /api/logs/summary
// @access  Private (Admin only)
const getActivitySummary = asyncHandler(async (req, res) => {
  const timeframe = req.query.timeframe || '24h'; // 24h, 7d, 30d, 90d
  
  // Calculate date range
  const timeframes = {
    '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
    '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    '90d': new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  };

  const startDate = timeframes[timeframe] || timeframes['24h'];

  // Get activity counts by category
  const categoryCounts = await Log.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get activity counts by action
  const actionCounts = await Log.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // Get failed actions
  const failedActions = await Log.aggregate([
    { 
      $match: { 
        createdAt: { $gte: startDate },
        status: 'failure'
      } 
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // Get most active users
  const activeUsers = await Log.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: '$user',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // Populate user data for active users
  const User = require('../models/userModel');
  const populatedActiveUsers = await User.populate(activeUsers, {
    path: '_id',
    select: 'name email role'
  });

  // Get hourly activity for last 24 hours
  const hourlyActivity = await Log.aggregate([
    { $match: { createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
    {
      $group: {
        _id: {
          hour: { $hour: '$createdAt' },
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.date': 1, '_id.hour': 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      timeframe,
      summary: {
        totalLogs: categoryCounts.reduce((sum, cat) => sum + cat.count, 0),
        categoryCounts,
        topActions: actionCounts,
        failedActions,
        activeUsers: populatedActiveUsers,
        hourlyActivity
      }
    }
  });
});

// @desc    Export logs
// @route   POST /api/logs/export
// @access  Private (Admin only)
const exportLogs = asyncHandler(async (req, res) => {
  const { startDate, endDate, format, filters } = req.body;

  let query = {};

  // Date range
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // Apply additional filters
  if (filters) {
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        query[key] = filters[key];
      }
    });
  }

  const logs = await Log.find(query)
    .populate('user', 'name email role')
    .sort({ createdAt: -1 });

  // Format data based on requested format
  let exportData;
  
  if (format === 'csv') {
    // Convert to CSV format
    const csvHeaders = ['Timestamp', 'User', 'Role', 'Action', 'Category', 'Status', 'IP', 'Details'];
    const csvRows = logs.map(log => [
      log.createdAt.toISOString(),
      log.user?.name || 'System',
      log.user?.role || 'system',
      log.action,
      log.category,
      log.status,
      log.metadata.ip,
      JSON.stringify(log.details)
    ]);
    
    exportData = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="accreditech-logs.csv"');
  } else {
    // JSON format
    exportData = JSON.stringify(logs, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="accreditech-logs.json"');
  }

  await Logger.logAdmin('logs_exported', req.user, req, {
    dateRange: { startDate, endDate },
    format,
    recordCount: logs.length,
    status: 'success'
  });

  res.send(exportData);
});

// @desc    Delete old logs
// @route   DELETE /api/logs/cleanup
// @access  Private (Admin only)
const cleanupLogs = asyncHandler(async (req, res) => {
  const { days = 365 } = req.body; // Default: keep logs for 1 year

  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await Log.deleteMany({
    createdAt: { $lt: cutoffDate },
    severity: { $nin: ['critical', 'high'] } // Keep critical and high severity logs
  });

  await Logger.logAdmin('logs_cleaned', req.user, req, {
    deletedCount: result.deletedCount,
    cutoffDate,
    daysKept: days,
    status: 'success'
  });

  res.status(200).json({
    success: true,
    message: `Cleaned up ${result.deletedCount} log entries older than ${days} days`,
    data: {
      deletedCount: result.deletedCount,
      cutoffDate
    }
  });
});

module.exports = {
  getLogs,
  getUserLogs,
  getActivitySummary,
  exportLogs,
  cleanupLogs
};