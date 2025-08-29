const User = require('../models/userModel');
const Institute = require('../models/instituteModel');
const Document = require('../models/documentModel');
const Reviewer = require('../models/reviewerModel');
const Auditor = require('../models/auditorModel');
const Review = require('../models/reviewModel');
const Audit = require('../models/auditModel');
const Log = require('../models/logModel');
const asyncHandler = require('../utils/asyncHandler');
const Logger = require('../utils/logger');
const emailService = require('../utils/emailService');

// @desc    Get admin dashboard overview
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
const getDashboard = asyncHandler(async (req, res) => {
  // Get counts for dashboard
  const [
    totalInstitutes,
    totalDocuments,
    totalReviewers,
    totalAuditors,
    pendingReviews,
    pendingAudits,
    recentLogs
  ] = await Promise.all([
    Institute.countDocuments(),
    Document.countDocuments(),
    Reviewer.countDocuments(),
    Auditor.countDocuments(),
    Review.countDocuments({ status: { $in: ['assigned', 'in_progress'] } }),
    Audit.countDocuments({ status: { $in: ['assigned', 'in_progress'] } }),
    Log.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name email role')
  ]);

  // Get status distribution for documents
  const documentStatusStats = await Document.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get workload stats for reviewers and auditors
  const reviewerWorkload = await Reviewer.aggregate([
    {
      $group: {
        _id: '$availability',
        count: { $sum: 1 }
      }
    }
  ]);

  const auditorWorkload = await Auditor.aggregate([
    {
      $group: {
        _id: '$availability',
        count: { $sum: 1 }
      }
    }
  ]);

  await Logger.logAdmin('dashboard_accessed', req.user, req, {
    targetResource: { type: 'Dashboard', name: 'Admin Dashboard' },
    status: 'success'
  });

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalInstitutes,
        totalDocuments,
        totalReviewers,
        totalAuditors,
        pendingReviews,
        pendingAudits
      },
      statistics: {
        documentStatus: documentStatusStats,
        reviewerWorkload,
        auditorWorkload
      },
      recentActivity: recentLogs
    }
  });
});

// @desc    Get all institutes
// @route   GET /api/admin/institutes
// @access  Private (Admin only)
const getInstitutes = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  let query = {};
  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { code: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const institutes = await Institute.find(query)
    .populate('administrator', 'name email')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Institute.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      institutes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Create new institute
// @route   POST /api/admin/institutes
// @access  Private (Admin only)
const createInstitute = asyncHandler(async (req, res) => {
  const institute = await Institute.create(req.body);

  await Logger.logAdmin('institute_created', req.user, req, {
    targetResource: {
      type: 'Institute',
      id: institute._id,
      name: institute.name
    },
    instituteCode: institute.code,
    status: 'success'
  });

  const populatedInstitute = await Institute.findById(institute._id)
    .populate('administrator', 'name email');

  res.status(201).json({
    success: true,
    message: 'Institute created successfully',
    data: { institute: populatedInstitute }
  });
});

// @desc    Update institute
// @route   PUT /api/admin/institutes/:id
// @access  Private (Admin only)
const updateInstitute = asyncHandler(async (req, res) => {
  const institute = await Institute.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('administrator', 'name email');

  if (!institute) {
    return res.status(404).json({
      success: false,
      message: 'Institute not found'
    });
  }

  await Logger.logAdmin('institute_updated', req.user, req, {
    targetResource: {
      type: 'Institute',
      id: institute._id,
      name: institute.name
    },
    updatedFields: Object.keys(req.body),
    status: 'success'
  });

  res.status(200).json({
    success: true,
    message: 'Institute updated successfully',
    data: { institute }
  });
});

// @desc    Assign reviewer to document
// @route   POST /api/admin/assign-reviewer
// @access  Private (Admin only)
const assignReviewer = asyncHandler(async (req, res) => {
  const { documentId, reviewerId, dueDate } = req.body;

  // Find document and reviewer
  const [document, reviewer] = await Promise.all([
    Document.findById(documentId),
    Reviewer.findById(reviewerId).populate('user', 'name email')
  ]);

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  if (!reviewer) {
    return res.status(404).json({
      success: false,
      message: 'Reviewer not found'
    });
  }

  // Check reviewer availability
  if (!reviewer.isAvailable) {
    return res.status(400).json({
      success: false,
      message: 'Reviewer is not available for new assignments'
    });
  }

  // Update document
  document.assignedReviewer = reviewerId;
  document.assignedBy.reviewer = req.user._id;
  document.assignmentDates.reviewerAssigned = new Date();
  document.dueDates.review = dueDate;
  document.status = 'assigned_for_review';
  await document.save();

  // Update reviewer workload
  reviewer.assignedDocuments.push({
    document: documentId,
    dueDate,
    status: 'assigned'
  });
  reviewer.workload.current += 1;
  await reviewer.save();

  // Send notification email
  try {
    await emailService.sendDocumentAssignment(
      reviewer.user.email,
      reviewer.user.name,
      document.title,
      'Reviewer',
      dueDate
    );
  } catch (error) {
    console.error('Failed to send assignment email:', error);
  }

  await Logger.logAdmin('reviewer_assigned', req.user, req, {
    targetResource: {
      type: 'Document',
      id: document._id,
      name: document.title
    },
    reviewerId: reviewer._id,
    reviewerName: reviewer.user.name,
    dueDate,
    status: 'success'
  });

  res.status(200).json({
    success: true,
    message: 'Reviewer assigned successfully',
    data: {
      document,
      reviewer: reviewer.user.name
    }
  });
});

// @desc    Assign auditor to document
// @route   POST /api/admin/assign-auditor
// @access  Private (Admin only)
const assignAuditor = asyncHandler(async (req, res) => {
  const { documentId, auditorId, dueDate } = req.body;

  // Find document and auditor
  const [document, auditor] = await Promise.all([
    Document.findById(documentId),
    Auditor.findById(auditorId).populate('user', 'name email')
  ]);

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  if (!auditor) {
    return res.status(404).json({
      success: false,
      message: 'Auditor not found'
    });
  }

  // Check if document has been reviewed
  if (document.status !== 'review_completed') {
    return res.status(400).json({
      success: false,
      message: 'Document must be reviewed before assigning auditor'
    });
  }

  // Check auditor availability
  if (!auditor.isAvailable) {
    return res.status(400).json({
      success: false,
      message: 'Auditor is not available for new assignments'
    });
  }

  // Update document
  document.assignedAuditor = auditorId;
  document.assignedBy.auditor = req.user._id;
  document.assignmentDates.auditorAssigned = new Date();
  document.dueDates.audit = dueDate;
  document.status = 'assigned_for_audit';
  await document.save();

  // Update auditor workload
  auditor.assignedDocuments.push({
    document: documentId,
    dueDate,
    status: 'assigned'
  });
  auditor.workload.current += 1;
  await auditor.save();

  // Send notification email
  try {
    await emailService.sendDocumentAssignment(
      auditor.user.email,
      auditor.user.name,
      document.title,
      'Auditor',
      dueDate
    );
  } catch (error) {
    console.error('Failed to send assignment email:', error);
  }

  await Logger.logAdmin('auditor_assigned', req.user, req, {
    targetResource: {
      type: 'Document',
      id: document._id,
      name: document.title
    },
    auditorId: auditor._id,
    auditorName: auditor.user.name,
    dueDate,
    status: 'success'
  });

  res.status(200).json({
    success: true,
    message: 'Auditor assigned successfully',
    data: {
      document,
      auditor: auditor.user.name
    }
  });
});

// @desc    Get available reviewers
// @route   GET /api/admin/reviewers
// @access  Private (Admin only)
const getReviewers = asyncHandler(async (req, res) => {
  const reviewers = await Reviewer.find({ availability: 'available' })
    .populate('user', 'name email status')
    .sort({ workloadPercentage: 1 });

  res.status(200).json({
    success: true,
    data: { reviewers }
  });
});

// @desc    Get available auditors
// @route   GET /api/admin/auditors
// @access  Private (Admin only)
const getAuditors = asyncHandler(async (req, res) => {
  const auditors = await Auditor.find({ availability: 'available' })
    .populate('user', 'name email status')
    .sort({ workloadPercentage: 1 });

  res.status(200).json({
    success: true,
    data: { auditors }
  });
});

// @desc    Get system reports
// @route   GET /api/admin/reports
// @access  Private (Admin only)
const getReports = asyncHandler(async (req, res) => {
  const { type, startDate, endDate } = req.query;

  let query = {};
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  let reportData = {};

  switch (type) {
    case 'documents':
      reportData = await this.getDocumentReport(query);
      break;
    case 'reviews':
      reportData = await this.getReviewReport(query);
      break;
    case 'audits':
      reportData = await this.getAuditReport(query);
      break;
    case 'performance':
      reportData = await this.getPerformanceReport(query);
      break;
    default:
      reportData = await this.getOverviewReport(query);
  }

  await Logger.logAdmin('report_generated', req.user, req, {
    reportType: type || 'overview',
    dateRange: { startDate, endDate },
    status: 'success'
  });

  res.status(200).json({
    success: true,
    data: reportData
  });
});

// Helper methods for reports
const getDocumentReport = async (query) => {
  const documents = await Document.find(query)
    .populate('institute', 'name code')
    .populate('assignedReviewer', 'user')
    .populate('assignedAuditor', 'user')
    .sort({ createdAt: -1 });

  const statusDistribution = await Document.aggregate([
    { $match: query },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  return {
    documents,
    statistics: {
      total: documents.length,
      statusDistribution
    }
  };
};

const getReviewReport = async (query) => {
  const reviews = await Review.find(query)
    .populate('reviewer', 'user')
    .populate('document', 'title')
    .populate('institute', 'name code')
    .sort({ createdAt: -1 });

  const avgScore = await Review.aggregate([
    { $match: query },
    { $group: { _id: null, avgScore: { $avg: '$reviewData.overallScore' } } }
  ]);

  return {
    reviews,
    statistics: {
      total: reviews.length,
      averageScore: avgScore[0]?.avgScore || 0
    }
  };
};

const getAuditReport = async (query) => {
  const audits = await Audit.find(query)
    .populate('auditor', 'user')
    .populate('document', 'title')
    .populate('institute', 'name code')
    .sort({ createdAt: -1 });

  const outcomes = await Audit.aggregate([
    { $match: query },
    { $group: { _id: '$finalDecision.outcome', count: { $sum: 1 } } }
  ]);

  return {
    audits,
    statistics: {
      total: audits.length,
      outcomes
    }
  };
};

const getPerformanceReport = async (query) => {
  const reviewerPerformance = await Review.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$reviewer',
        avgScore: { $avg: '$reviewData.overallScore' },
        totalReviews: { $sum: 1 },
        avgTimeSpent: { $avg: { $subtract: ['$timeline.completedAt', '$timeline.startedAt'] } }
      }
    }
  ]);

  const auditorPerformance = await Audit.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$auditor',
        totalAudits: { $sum: 1 },
        avgTimeSpent: { $avg: { $subtract: ['$timeline.completedAt', '$timeline.startedAt'] } }
      }
    }
  ]);

  return {
    reviewerPerformance,
    auditorPerformance
  };
};

const getOverviewReport = async (query) => {
  const [documents, reviews, audits] = await Promise.all([
    getDocumentReport(query),
    getReviewReport(query),
    getAuditReport(query)
  ]);

  return {
    overview: {
      totalDocuments: documents.statistics.total,
      totalReviews: reviews.statistics.total,
      totalAudits: audits.statistics.total,
      averageReviewScore: reviews.statistics.averageScore
    },
    documents: documents.statistics,
    reviews: reviews.statistics,
    audits: audits.statistics
  };
};

// @desc    Manage user accounts
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  let query = {};
  if (req.query.role) {
    query.role = req.query.role;
  }
  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password -refreshTokens -logs')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).select('-password -refreshTokens');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  await Logger.logAdmin('user_status_changed', req.user, req, {
    targetResource: {
      type: 'User',
      id: user._id,
      name: user.name
    },
    oldStatus: req.body.oldStatus,
    newStatus: status,
    status: 'success'
  });

  res.status(200).json({
    success: true,
    message: 'User status updated successfully',
    data: { user }
  });
});

module.exports = {
  getDashboard,
  getInstitutes,
  createInstitute,
  updateInstitute,
  assignReviewer,
  assignAuditor,
  getReviewers,
  getAuditors,
  getReports,
  getUsers,
  updateUserStatus
};