const Audit = require('../models/auditModel');
const Document = require('../models/documentModel');
const Review = require('../models/reviewModel');
const Auditor = require('../models/auditorModel');
const asyncHandler = require('../utils/asyncHandler');
const Logger = require('../utils/logger');
const emailService = require('../utils/emailService');

// @desc    Get auditor dashboard
// @route   GET /api/audits/dashboard
// @access  Private (Auditor only)
const getAuditorDashboard = asyncHandler(async (req, res) => {
  // Find auditor profile
  const auditor = await Auditor.findOne({ user: req.user._id })
    .populate('assignedDocuments.document', 'title type status dueDates.audit');

  if (!auditor) {
    return res.status(404).json({
      success: false,
      message: 'Auditor profile not found'
    });
  }

  // Get assigned documents
  const assignedDocuments = await Document.find({
    assignedAuditor: auditor._id,
    status: { $in: ['assigned_for_audit', 'under_audit'] }
  }).populate('institute', 'name code')
    .populate('assignedReviewer', 'user specialization')
    .sort({ 'dueDates.audit': 1 });

  // Get completed audits
  const completedAudits = await Audit.find({ auditor: auditor._id })
    .populate('document', 'title type')
    .populate('institute', 'name code')
    .sort({ createdAt: -1 })
    .limit(10);

  // Calculate statistics
  const overdueDocuments = assignedDocuments.filter(doc => 
    doc.dueDates.audit && new Date(doc.dueDates.audit) < new Date()
  );

  const stats = {
    totalAssigned: assignedDocuments.length,
    totalCompleted: auditor.completedAudits,
    overdue: overdueDocuments.length,
    averageAuditTime: auditor.averageAuditTime,
    currentWorkload: auditor.workloadPercentage,
    overallPerformance: auditor.overallPerformance
  };

  res.status(200).json({
    success: true,
    data: {
      auditor,
      assignedDocuments,
      completedAudits,
      statistics: stats
    }
  });
});

// @desc    Start audit for a document
// @route   POST /api/audits/start/:documentId
// @access  Private (Auditor only)
const startAudit = asyncHandler(async (req, res) => {
  const documentId = req.params.documentId;

  // Find auditor profile
  const auditor = await Auditor.findOne({ user: req.user._id });
  if (!auditor) {
    return res.status(404).json({
      success: false,
      message: 'Auditor profile not found'
    });
  }

  // Find document and its review
  const [document, review] = await Promise.all([
    Document.findById(documentId),
    Review.findOne({ document: documentId, status: 'submitted' })
  ]);

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  if (!review) {
    return res.status(400).json({
      success: false,
      message: 'No completed review found for this document'
    });
  }

  // Check if document is assigned to this auditor
  if (document.assignedAuditor.toString() !== auditor._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Document not assigned to you'
    });
  }

  // Check if audit already exists
  let audit = await Audit.findOne({ document: documentId, auditor: auditor._id });
  
  if (!audit) {
    // Create new audit
    audit = await Audit.create({
      document: documentId,
      review: review._id,
      auditor: auditor._id,
      institute: document.institute,
      timeline: {
        assignedAt: document.assignmentDates.auditorAssigned || new Date(),
        startedAt: new Date(),
        dueDate: document.dueDates.audit
      },
      auditData: {
        reviewValidation: {
          accuracyScore: 0,
          completenessScore: 0,
          consistencyScore: 0
        },
        criteriaValidation: [],
        complianceCheck: {
          standardsVerification: [],
          overallCompliance: 'partially_compliant'
        },
        findings: [],
        riskAssessment: {
          risks: [],
          overallRisk: 'medium'
        }
      }
    });

    // Add to audit trail
    await audit.addToTrail('audit_started', req.user._id, {
      documentId,
      reviewId: review._id,
      startTime: new Date()
    }, req);
  }

  // Update document status
  document.status = 'under_audit';
  await document.save();

  // Update auditor's assigned document status
  const assignedDoc = auditor.assignedDocuments.find(doc => 
    doc.document.toString() === documentId
  );
  if (assignedDoc) {
    assignedDoc.status = 'in_progress';
    await auditor.save();
  }

  await Logger.logDocument('audit_started', req.user, req, document, {
    auditId: audit._id,
    reviewId: review._id,
    status: 'success'
  });

  const populatedAudit = await Audit.findById(audit._id)
    .populate('document', 'title description type')
    .populate('review')
    .populate('auditor', 'user licenseNumber specialization');

  res.status(200).json({
    success: true,
    message: 'Audit started successfully',
    data: { audit: populatedAudit, review }
  });
});

// @desc    Update audit
// @route   PUT /api/audits/:id
// @access  Private (Auditor only)
const updateAudit = asyncHandler(async (req, res) => {
  let audit = await Audit.findById(req.params.id);

  if (!audit) {
    return res.status(404).json({
      success: false,
      message: 'Audit not found'
    });
  }

  // Check if this auditor owns the audit
  const auditor = await Auditor.findOne({ user: req.user._id });
  if (audit.auditor.toString() !== auditor._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Don't allow updates if audit is completed
  if (audit.status === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update completed audit'
    });
  }

  const allowedFields = ['auditData', 'finalDecision', 'quality'];
  const updates = {};

  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  audit = await Audit.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  );

  // Add to audit trail
  await audit.addToTrail('audit_updated', req.user._id, {
    updatedFields: Object.keys(updates),
    updateTime: new Date()
  }, req);

  await Logger.logDocument('audit_updated', req.user, req, audit, {
    auditId: audit._id,
    updatedFields: Object.keys(updates),
    status: 'success'
  });

  res.status(200).json({
    success: true,
    message: 'Audit updated successfully',
    data: { audit }
  });
});

// @desc    Submit audit (final decision)
// @route   POST /api/audits/:id/submit
// @access  Private (Auditor only)
const submitAudit = asyncHandler(async (req, res) => {
  const { finalDecision, digitalSignature } = req.body;

  const audit = await Audit.findById(req.params.id)
    .populate('document')
    .populate('review')
    .populate('institute', 'name contactInfo');

  if (!audit) {
    return res.status(404).json({
      success: false,
      message: 'Audit not found'
    });
  }

  // Check if this auditor owns the audit
  const auditor = await Auditor.findOne({ user: req.user._id });
  if (audit.auditor.toString() !== auditor._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Validate audit completion
  if (!finalDecision || !finalDecision.outcome || !finalDecision.justification) {
    return res.status(400).json({
      success: false,
      message: 'Final decision and justification are required'
    });
  }

  // Update audit with final decision
  audit.finalDecision = finalDecision;
  audit.status = 'completed';
  audit.timeline.submittedAt = new Date();
  audit.timeline.completedAt = new Date();
  audit.auditorSignature = {
    signed: true,
    signedAt: new Date(),
    digitalSignature: digitalSignature || `${req.user.name}-${new Date().toISOString()}`,
    signatureIP: req.ip
  };

  await audit.save();

  // Update document status based on audit outcome
  const document = await Document.findById(audit.document._id);
  const statusMap = {
    'approved': 'approved',
    'approved_with_conditions': 'approved',
    'rejected': 'rejected',
    'requires_revision': 'revision_required'
  };
  
  document.status = statusMap[finalDecision.outcome] || 'audit_completed';
  await document.save();

  // Update auditor statistics
  auditor.completedAudits += 1;
  
  // Calculate and update average audit time
  const auditTime = (audit.timeline.completedAt - audit.timeline.startedAt) / (1000 * 60 * 60); // hours
  auditor.averageAuditTime = auditor.averageAuditTime === 0 ? 
    auditTime : 
    (auditor.averageAuditTime + auditTime) / 2;

  // Update assigned document status
  const assignedDoc = auditor.assignedDocuments.find(doc => 
    doc.document.toString() === audit.document._id.toString()
  );
  if (assignedDoc) {
    assignedDoc.status = 'completed';
  }
  
  // Reduce current workload
  auditor.workload.current = Math.max(0, auditor.workload.current - 1);

  // Add to audit history
  auditor.auditHistory.push({
    document: audit.document._id,
    institute: audit.institute._id,
    completedDate: new Date(),
    outcome: finalDecision.outcome,
    score: finalDecision.finalScore || 0
  });

  await auditor.save();

  // Add to audit trail
  await audit.addToTrail('audit_completed', req.user._id, {
    outcome: finalDecision.outcome,
    finalScore: finalDecision.finalScore,
    completionTime: new Date()
  }, req);

  // Send notification to institute
  try {
    await emailService.sendStatusUpdate(
      audit.institute.contactInfo.email,
      audit.institute.name,
      audit.document.title,
      'under_audit',
      document.status
    );
  } catch (error) {
    console.error('Failed to send audit completion email:', error);
  }

  await Logger.logDocument('audit_completed', req.user, req, audit, {
    auditId: audit._id,
    documentTitle: audit.document.title,
    outcome: finalDecision.outcome,
    finalScore: finalDecision.finalScore,
    status: 'success'
  });

  res.status(200).json({
    success: true,
    message: 'Audit submitted successfully',
    data: { audit }
  });
});

// @desc    Get audit by ID
// @route   GET /api/audits/:id
// @access  Private
const getAudit = asyncHandler(async (req, res) => {
  const audit = await Audit.findById(req.params.id)
    .populate('document', 'title description type fileInfo')
    .populate('review')
    .populate('auditor', 'user licenseNumber specialization experience')
    .populate('institute', 'name code contactInfo');

  if (!audit) {
    return res.status(404).json({
      success: false,
      message: 'Audit not found'
    });
  }

  // Check permissions
  const auditor = await Auditor.findOne({ user: req.user._id });
  const hasPermission = 
    req.user.role === 'admin' ||
    (req.user.role === 'auditor' && audit.auditor._id.toString() === auditor._id.toString()) ||
    (req.user.role === 'institute' && audit.document.uploadedBy.toString() === req.user._id.toString());

  if (!hasPermission) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.status(200).json({
    success: true,
    data: { audit }
  });
});

// @desc    Get all audits for a document
// @route   GET /api/audits/document/:documentId
// @access  Private
const getDocumentAudits = asyncHandler(async (req, res) => {
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
    (document.assignedAuditor && document.assignedAuditor.toString() === req.user.auditorId);

  if (!hasPermission) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const audits = await Audit.find({ document: documentId })
    .populate('auditor', 'user licenseNumber specialization experience')
    .populate('review', 'reviewData.overallScore status')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: { audits }
  });
});

// @desc    Add audit finding
// @route   POST /api/audits/:id/findings
// @access  Private (Auditor only)
const addAuditFinding = asyncHandler(async (req, res) => {
  const { category, description, evidence, impact, recommendation, timeline, responsible } = req.body;

  const audit = await Audit.findById(req.params.id);

  if (!audit) {
    return res.status(404).json({
      success: false,
      message: 'Audit not found'
    });
  }

  // Check if this auditor owns the audit
  const auditor = await Auditor.findOne({ user: req.user._id });
  if (audit.auditor.toString() !== auditor._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Add finding
  const finding = {
    category,
    description,
    evidence,
    impact,
    recommendation,
    timeline,
    responsible
  };

  audit.auditData.findings.push(finding);
  await audit.save();

  // Add to audit trail
  await audit.addToTrail('finding_added', req.user._id, {
    findingCategory: category,
    severity: category === 'critical' ? 'high' : 'medium'
  }, req);

  res.status(200).json({
    success: true,
    message: 'Finding added successfully',
    data: { finding, audit }
  });
});

// @desc    Update compliance check
// @route   PUT /api/audits/:id/compliance
// @access  Private (Auditor only)
const updateComplianceCheck = asyncHandler(async (req, res) => {
  const { standardsVerification, overallCompliance } = req.body;

  const audit = await Audit.findById(req.params.id);

  if (!audit) {
    return res.status(404).json({
      success: false,
      message: 'Audit not found'
    });
  }

  // Check if this auditor owns the audit
  const auditor = await Auditor.findOne({ user: req.user._id });
  if (audit.auditor.toString() !== auditor._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Update compliance check
  if (standardsVerification) {
    audit.auditData.complianceCheck.standardsVerification = standardsVerification;
  }
  if (overallCompliance) {
    audit.auditData.complianceCheck.overallCompliance = overallCompliance;
  }

  await audit.save();

  // Add to audit trail
  await audit.addToTrail('compliance_updated', req.user._id, {
    overallCompliance,
    standardsCount: standardsVerification?.length || 0
  }, req);

  res.status(200).json({
    success: true,
    message: 'Compliance check updated successfully',
    data: { audit }
  });
});

// @desc    Validate reviewer's assessment
// @route   POST /api/audits/:id/validate-review
// @access  Private (Auditor only)
const validateReviewAssessment = asyncHandler(async (req, res) => {
  const { reviewValidation } = req.body;

  const audit = await Audit.findById(req.params.id)
    .populate('review');

  if (!audit) {
    return res.status(404).json({
      success: false,
      message: 'Audit not found'
    });
  }

  // Check if this auditor owns the audit
  const auditor = await Auditor.findOne({ user: req.user._id });
  if (audit.auditor.toString() !== auditor._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Update review validation
  audit.auditData.reviewValidation = {
    accuracyScore: reviewValidation.accuracyScore,
    completenessScore: reviewValidation.completenessScore,
    consistencyScore: reviewValidation.consistencyScore,
    validationComments: reviewValidation.validationComments
  };

  // Validate individual criteria if provided
  if (reviewValidation.criteriaValidation) {
    audit.auditData.criteriaValidation = reviewValidation.criteriaValidation.map(criteria => ({
      criteriaName: criteria.criteriaName,
      reviewerScore: criteria.reviewerScore,
      auditorScore: criteria.auditorScore,
      variance: Math.abs(criteria.reviewerScore - criteria.auditorScore),
      acceptable: Math.abs(criteria.reviewerScore - criteria.auditorScore) <= 10, // 10% variance tolerance
      auditorComments: criteria.auditorComments,
      evidenceValidated: criteria.evidenceValidated
    }));
  }

  await audit.save();

  // Add to audit trail
  await audit.addToTrail('review_validated', req.user._id, {
    accuracyScore: reviewValidation.accuracyScore,
    completenessScore: reviewValidation.completenessScore,
    consistencyScore: reviewValidation.consistencyScore
  }, req);

  res.status(200).json({
    success: true,
    message: 'Review assessment validated successfully',
    data: { audit }
  });
});

module.exports = {
  getAuditorDashboard,
  startAudit,
  updateAudit,
  submitAudit,
  getAudit,
  getDocumentAudits,
  addAuditFinding,
  updateComplianceCheck,
  validateReviewAssessment
};