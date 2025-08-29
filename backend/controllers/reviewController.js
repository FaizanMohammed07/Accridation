const Review = require('../models/reviewModel');
const Document = require('../models/documentModel');
const Reviewer = require('../models/reviewerModel');
const asyncHandler = require('../utils/asyncHandler');
const Logger = require('../utils/logger');
const emailService = require('../utils/emailService');

// @desc    Get reviewer dashboard
// @route   GET /api/reviews/dashboard
// @access  Private (Reviewer only)
const getReviewerDashboard = asyncHandler(async (req, res) => {
  // Find reviewer profile
  const reviewer = await Reviewer.findOne({ user: req.user._id })
    .populate('assignedDocuments.document', 'title type status dueDates.review');

  if (!reviewer) {
    return res.status(404).json({
      success: false,
      message: 'Reviewer profile not found'
    });
  }

  // Get assigned documents
  const assignedDocuments = await Document.find({
    assignedReviewer: reviewer._id,
    status: { $in: ['assigned_for_review', 'under_review'] }
  }).populate('institute', 'name code')
    .sort({ 'dueDates.review': 1 });

  // Get completed reviews
  const completedReviews = await Review.find({ reviewer: reviewer._id })
    .populate('document', 'title type')
    .populate('institute', 'name code')
    .sort({ createdAt: -1 })
    .limit(10);

  // Calculate statistics
  const overdueDocuments = assignedDocuments.filter(doc => 
    doc.dueDates.review && new Date(doc.dueDates.review) < new Date()
  );

  const stats = {
    totalAssigned: assignedDocuments.length,
    totalCompleted: reviewer.completedReviews,
    overdue: overdueDocuments.length,
    averageReviewTime: reviewer.averageReviewTime,
    currentWorkload: reviewer.workloadPercentage
  };

  res.status(200).json({
    success: true,
    data: {
      reviewer,
      assignedDocuments,
      completedReviews,
      statistics: stats
    }
  });
});

// @desc    Start review for a document
// @route   POST /api/reviews/start/:documentId
// @access  Private (Reviewer only)
const startReview = asyncHandler(async (req, res) => {
  const documentId = req.params.documentId;

  // Find reviewer profile
  const reviewer = await Reviewer.findOne({ user: req.user._id });
  if (!reviewer) {
    return res.status(404).json({
      success: false,
      message: 'Reviewer profile not found'
    });
  }

  // Find document
  const document = await Document.findById(documentId);
  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  // Check if document is assigned to this reviewer
  if (document.assignedReviewer.toString() !== reviewer._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Document not assigned to you'
    });
  }

  // Check if review already exists
  let review = await Review.findOne({ document: documentId, reviewer: reviewer._id });
  
  if (!review) {
    // Create new review
    review = await Review.create({
      document: documentId,
      reviewer: reviewer._id,
      institute: document.institute,
      timeline: {
        startedAt: new Date(),
        dueDate: document.dueDates.review
      },
      reviewData: {
        criteria: [],
        strengths: [],
        weaknesses: [],
        recommendations: []
      }
    });
  }

  // Update document status
  document.status = 'under_review';
  await document.save();

  // Update reviewer's assigned document status
  const assignedDoc = reviewer.assignedDocuments.find(doc => 
    doc.document.toString() === documentId
  );
  if (assignedDoc) {
    assignedDoc.status = 'in_progress';
    await reviewer.save();
  }

  await Logger.logDocument('review_started', req.user, req, document, {
    reviewId: review._id,
    status: 'success'
  });

  res.status(200).json({
    success: true,
    message: 'Review started successfully',
    data: { review }
  });
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private (Reviewer only)
const updateReview = asyncHandler(async (req, res) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Check if this reviewer owns the review
  const reviewer = await Reviewer.findOne({ user: req.user._id });
  if (review.reviewer.toString() !== reviewer._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Don't allow updates if review is submitted
  if (review.status === 'submitted') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update submitted review'
    });
  }

  const allowedFields = ['reviewData', 'feedback'];
  const updates = {};

  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Calculate overall score if criteria are provided
  if (updates.reviewData && updates.reviewData.criteria) {
    let totalScore = 0;
    let totalWeight = 0;
    
    updates.reviewData.criteria.forEach(criterion => {
      totalScore += criterion.score * (criterion.weight || 1);
      totalWeight += (criterion.weight || 1);
    });
    
    updates.reviewData.overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  // Add to revision history
  const revisionData = {
    version: (review.revisionHistory?.length || 0) + 1,
    modifiedAt: new Date(),
    modifiedBy: req.user._id,
    changes: JSON.stringify(updates),
    reason: req.body.reason || 'Review updated'
  };

  review = await Review.findByIdAndUpdate(
    req.params.id,
    { 
      ...updates,
      $push: { revisionHistory: revisionData }
    },
    { new: true, runValidators: true }
  );

  await Logger.logDocument('review_updated', req.user, req, review, {
    reviewId: review._id,
    updatedFields: Object.keys(updates),
    status: 'success'
  });

  res.status(200).json({
    success: true,
    message: 'Review updated successfully',
    data: { review }
  });
});

// @desc    Submit review
// @route   POST /api/reviews/:id/submit
// @access  Private (Reviewer only)
const submitReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate('document')
    .populate('institute', 'name contactInfo');

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Check if this reviewer owns the review
  const reviewer = await Reviewer.findOne({ user: req.user._id });
  if (review.reviewer.toString() !== reviewer._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Validate review completion
  if (!review.reviewData.overallScore || review.reviewData.criteria.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Review is incomplete. Please add criteria and overall score'
    });
  }

  // Submit review
  review.status = 'submitted';
  review.timeline.submittedAt = new Date();
  review.timeline.completedAt = new Date();
  review.reviewerSignature = {
    signed: true,
    signedAt: new Date(),
    digitalSignature: `${req.user.name}-${new Date().toISOString()}`
  };

  await review.save();

  // Update document status
  const document = await Document.findById(review.document._id);
  document.status = 'review_completed';
  await document.save();

  // Update reviewer statistics
  reviewer.completedReviews += 1;
  
  // Calculate and update average review time
  const reviewTime = (review.timeline.completedAt - review.timeline.startedAt) / (1000 * 60 * 60); // hours
  reviewer.averageReviewTime = reviewer.averageReviewTime === 0 ? 
    reviewTime : 
    (reviewer.averageReviewTime + reviewTime) / 2;

  // Update assigned document status
  const assignedDoc = reviewer.assignedDocuments.find(doc => 
    doc.document.toString() === review.document._id.toString()
  );
  if (assignedDoc) {
    assignedDoc.status = 'completed';
  }
  
  // Reduce current workload
  reviewer.workload.current = Math.max(0, reviewer.workload.current - 1);
  await reviewer.save();

  // Send notification to institute
  try {
    await emailService.sendStatusUpdate(
      review.institute.contactInfo.email,
      review.institute.name,
      review.document.title,
      'under_review',
      'review_completed'
    );
  } catch (error) {
    console.error('Failed to send review completion email:', error);
  }

  await Logger.logDocument('review_submitted', req.user, req, review, {
    reviewId: review._id,
    documentTitle: review.document.title,
    overallScore: review.reviewData.overallScore,
    status: 'success'
  });

  res.status(200).json({
    success: true,
    message: 'Review submitted successfully',
    data: { review }
  });
});

// @desc    Get review by ID
// @route   GET /api/reviews/:id
// @access  Private
const getReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate('document', 'title description type fileInfo')
    .populate('reviewer', 'user specialization experience')
    .populate('institute', 'name code contactInfo');

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found'
    });
  }

  // Check permissions
  const reviewer = await Reviewer.findOne({ user: req.user._id });
  const hasPermission = 
    req.user.role === 'admin' ||
    (req.user.role === 'reviewer' && review.reviewer._id.toString() === reviewer._id.toString()) ||
    (req.user.role === 'institute' && review.document.uploadedBy.toString() === req.user._id.toString()) ||
    (req.user.role === 'auditor'); // Auditors can view reviews for audit purposes

  if (!hasPermission) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.status(200).json({
    success: true,
    data: { review }
  });
});

// @desc    Get all reviews for a document
// @route   GET /api/reviews/document/:documentId
// @access  Private
const getDocumentReviews = asyncHandler(async (req, res) => {
  const documentId = req.params.documentId;

  // Check if document exists and user has permission
  const document = await Document.findById(documentId);
  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  // Check permissions
  const hasPermission = 
    req.user.role === 'admin' ||
    document.uploadedBy.toString() === req.user._id.toString() ||
    (document.assignedReviewer && document.assignedReviewer.toString() === req.user.reviewerId) ||
    (document.assignedAuditor && document.assignedAuditor.toString() === req.user.auditorId);

  if (!hasPermission) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const reviews = await Review.find({ document: documentId })
    .populate('reviewer', 'user specialization experience rating')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: { reviews }
  });
});

module.exports = {
  getReviewerDashboard,
  startReview,
  updateReview,
  submitReview,
  getReview,
  getDocumentReviews
};