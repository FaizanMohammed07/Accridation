const Document = require('../models/documentModel');
const Institute = require('../models/instituteModel');
const asyncHandler = require('../utils/asyncHandler');
const Logger = require('../utils/logger');
const { uploadToCloudinary } = require('../config/cloudinary');
const fs = require('fs');

// @desc    Upload new document
// @route   POST /api/documents/upload
// @access  Private (Institute only)
const uploadDocument = asyncHandler(async (req, res) => {
  const { title, description, type, category, tags } = req.body;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a file'
    });
  }

  // Find the institute associated with the user
  const institute = await Institute.findOne({ administrator: req.user._id });
  if (!institute) {
    return res.status(403).json({
      success: false,
      message: 'No institute found for this user'
    });
  }

  try {
    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file, 'accreditech/documents');

    // Create document record
    const document = await Document.create({
      title,
      description,
      type,
      category: category || 'mandatory',
      institute: institute._id,
      uploadedBy: req.user._id,
      fileInfo: {
        originalName: req.file.originalname,
        fileName: cloudinaryResult.original_filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        cloudinaryUrl: cloudinaryResult.secure_url,
        cloudinaryId: cloudinaryResult.public_id
      },
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      workflow: {
        currentStage: 'upload',
        stages: [
          {
            name: 'upload',
            status: 'completed',
            startedAt: new Date(),
            completedAt: new Date(),
            assignedTo: req.user._id
          }
        ]
      },
      metadata: {
        checksum: cloudinaryResult.etag || '',
        lastModified: new Date()
      }
    });

    // Update institute's document list
    institute.documents.push(document._id);
    await institute.save();

    // Remove uploaded file from server
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    await Logger.logDocument('document_uploaded', req.user, req, document, {
      documentType: type,
      fileSize: req.file.size,
      status: 'success'
    });

    const populatedDocument = await Document.findById(document._id)
      .populate('institute', 'name code')
      .populate('uploadedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: { document: populatedDocument }
    });
  } catch (error) {
    // Remove uploaded file if cloudinary upload fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    await Logger.logDocument('document_upload_failed', req.user, req, null, {
      reason: error.message,
      status: 'failure'
    });

    throw error;
  }
});

// @desc    Get documents for institute
// @route   GET /api/documents
// @access  Private (Institute)
const getDocuments = asyncHandler(async (req, res) => {
  let query = {};

  // Role-based filtering
  if (req.user.role === 'institute') {
    const institute = await Institute.findOne({ administrator: req.user._id });
    if (!institute) {
      return res.status(403).json({
        success: false,
        message: 'No institute found for this user'
      });
    }
    query.institute = institute._id;
  } else if (req.user.role === 'reviewer') {
    query.assignedReviewer = req.user.reviewerId;
  } else if (req.user.role === 'auditor') {
    query.assignedAuditor = req.user.auditorId;
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Add filters
  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.type) {
    query.type = req.query.type;
  }
  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const documents = await Document.find(query)
    .populate('institute', 'name code')
    .populate('uploadedBy', 'name email')
    .populate('assignedReviewer', 'user specialization')
    .populate('assignedAuditor', 'user licenseNumber')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Document.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
const getDocument = asyncHandler(async (req, res) => {
  let document = await Document.findById(req.params.id)
    .populate('institute', 'name code contactInfo')
    .populate('uploadedBy', 'name email')
    .populate('assignedReviewer', 'user specialization experience rating')
    .populate('assignedAuditor', 'user licenseNumber experience rating');

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  // Check permissions
  const hasPermission = 
    req.user.role === 'admin' ||
    (req.user.role === 'institute' && document.uploadedBy._id.toString() === req.user._id.toString()) ||
    (req.user.role === 'reviewer' && document.assignedReviewer?.user.toString() === req.user._id.toString()) ||
    (req.user.role === 'auditor' && document.assignedAuditor?.user.toString() === req.user._id.toString());

  if (!hasPermission) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this document'
    });
  }

  // Increment access count
  document.metadata.accessCount += 1;
  await document.save();

  await Logger.logDocument('document_viewed', req.user, req, document, {
    status: 'success'
  });

  res.status(200).json({
    success: true,
    data: { document }
  });
});

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private (Institute only - own documents)
const updateDocument = asyncHandler(async (req, res) => {
  let document = await Document.findById(req.params.id);

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  // Check if user is institute admin and owns this document
  if (req.user.role !== 'admin' && document.uploadedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Don't allow updates if document is being reviewed or audited
  if (['under_review', 'under_audit', 'approved'].includes(document.status)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot update document while it is being processed'
    });
  }

  const allowedFields = ['title', 'description', 'tags'];
  const updates = {};

  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  if (updates.tags && typeof updates.tags === 'string') {
    updates.tags = updates.tags.split(',').map(tag => tag.trim());
  }

  document = await Document.findByIdAndUpdate(
    req.params.id,
    { ...updates, 'metadata.lastModified': new Date() },
    { new: true, runValidators: true }
  ).populate('institute', 'name code');

  await Logger.logDocument('document_updated', req.user, req, document, {
    updatedFields: Object.keys(updates),
    status: 'success'
  });

  res.status(200).json({
    success: true,
    message: 'Document updated successfully',
    data: { document }
  });
});

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private (Institute only - own documents)
const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  // Check permissions
  if (req.user.role !== 'admin' && document.uploadedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Don't allow deletion if document is being processed
  if (['under_review', 'under_audit', 'approved'].includes(document.status)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete document while it is being processed'
    });
  }

  // Remove from Cloudinary
  try {
    const { cloudinary } = require('../config/cloudinary');
    await cloudinary.uploader.destroy(document.fileInfo.cloudinaryId);
  } catch (error) {
    console.error('Failed to delete file from Cloudinary:', error);
  }

  await Document.findByIdAndDelete(req.params.id);

  await Logger.logDocument('document_deleted', req.user, req, document, {
    documentTitle: document.title,
    status: 'success'
  });

  res.status(200).json({
    success: true,
    message: 'Document deleted successfully'
  });
});

// @desc    Download document
// @route   GET /api/documents/:id/download
// @access  Private
const downloadDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  // Check permissions (same as getDocument)
  const hasPermission = 
    req.user.role === 'admin' ||
    document.uploadedBy.toString() === req.user._id.toString() ||
    (document.assignedReviewer && document.assignedReviewer.toString() === req.user.reviewerId) ||
    (document.assignedAuditor && document.assignedAuditor.toString() === req.user.auditorId);

  if (!hasPermission) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to download this document'
    });
  }

  // Increment download count
  document.metadata.downloadCount += 1;
  await document.save();

  await Logger.logDocument('document_downloaded', req.user, req, document, {
    status: 'success'
  });

  // Redirect to Cloudinary URL for download
  res.redirect(document.fileInfo.cloudinaryUrl);
});

// @desc    Get document status history
// @route   GET /api/documents/:id/history
// @access  Private
const getDocumentHistory = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id)
    .populate('institute', 'name code')
    .populate('uploadedBy', 'name email')
    .populate('assignedReviewer', 'user specialization')
    .populate('assignedAuditor', 'user licenseNumber');

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
    (document.assignedReviewer && document.assignedReviewer.user.toString() === req.user._id.toString()) ||
    (document.assignedAuditor && document.assignedAuditor.user.toString() === req.user._id.toString());

  if (!hasPermission) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Get related reviews and audits
  const Review = require('../models/reviewModel');
  const Audit = require('../models/auditModel');

  const [reviews, audits] = await Promise.all([
    Review.find({ document: req.params.id })
      .populate('reviewer', 'user specialization')
      .sort({ createdAt: -1 }),
    Audit.find({ document: req.params.id })
      .populate('auditor', 'user licenseNumber')
      .sort({ createdAt: -1 })
  ]);

  res.status(200).json({
    success: true,
    data: {
      document,
      reviews,
      audits,
      workflow: document.workflow
    }
  });
});

// @desc    Update document status (Admin only)
// @route   PUT /api/documents/:id/status
// @access  Private (Admin only)
const updateDocumentStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;

  const document = await Document.findById(req.params.id)
    .populate('institute', 'name contactInfo')
    .populate('uploadedBy', 'name email');

  if (!document) {
    return res.status(404).json({
      success: false,
      message: 'Document not found'
    });
  }

  const oldStatus = document.status;
  document.status = status;

  // Update workflow stage
  const stageMap = {
    'uploaded': 'upload',
    'assigned_for_review': 'review_assignment',
    'under_review': 'review',
    'review_completed': 'review',
    'assigned_for_audit': 'audit_assignment',
    'under_audit': 'audit',
    'audit_completed': 'audit',
    'approved': 'final_decision',
    'rejected': 'final_decision'
  };

  document.workflow.currentStage = stageMap[status] || 'upload';

  // Add workflow stage if new
  const existingStage = document.workflow.stages.find(s => s.name === document.workflow.currentStage);
  if (!existingStage) {
    document.workflow.stages.push({
      name: document.workflow.currentStage,
      status: 'in_progress',
      startedAt: new Date(),
      assignedTo: req.user._id,
      notes
    });
  }

  await document.save();

  // Send status update email to institute
  try {
    const emailService = require('../utils/emailService');
    await emailService.sendStatusUpdate(
      document.uploadedBy.email,
      document.uploadedBy.name,
      document.title,
      oldStatus,
      status
    );
  } catch (error) {
    console.error('Failed to send status update email:', error);
  }

  await Logger.logAdmin('document_status_changed', req.user, req, {
    targetResource: {
      type: 'Document',
      id: document._id,
      name: document.title
    },
    oldStatus,
    newStatus: status,
    status: 'success'
  });

  res.status(200).json({
    success: true,
    message: 'Document status updated successfully',
    data: { document }
  });
});

// @desc    Get documents assigned to current user (reviewer/auditor)
// @route   GET /api/documents/assigned
// @access  Private (Reviewer/Auditor only)
const getAssignedDocuments = asyncHandler(async (req, res) => {
  let query = {};
  let populateField = '';

  if (req.user.role === 'reviewer') {
    // Find reviewer profile
    const Reviewer = require('../models/reviewerModel');
    const reviewer = await Reviewer.findOne({ user: req.user._id });
    if (!reviewer) {
      return res.status(404).json({
        success: false,
        message: 'Reviewer profile not found'
      });
    }
    query.assignedReviewer = reviewer._id;
    populateField = 'assignedReviewer';
  } else if (req.user.role === 'auditor') {
    // Find auditor profile
    const Auditor = require('../models/auditorModel');
    const auditor = await Auditor.findOne({ user: req.user._id });
    if (!auditor) {
      return res.status(404).json({
        success: false,
        message: 'Auditor profile not found'
      });
    }
    query.assignedAuditor = auditor._id;
    populateField = 'assignedAuditor';
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Add status filter for assigned documents
  if (req.user.role === 'reviewer') {
    query.status = { $in: ['assigned_for_review', 'under_review'] };
  } else if (req.user.role === 'auditor') {
    query.status = { $in: ['assigned_for_audit', 'under_audit'] };
  }

  const documents = await Document.find(query)
    .populate('institute', 'name code')
    .populate('uploadedBy', 'name email')
    .populate(populateField, 'user specialization experience')
    .skip(skip)
    .limit(limit)
    .sort({ 'dueDates.review': 1, 'dueDates.audit': 1 });

  const total = await Document.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

module.exports = {
  uploadDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
  getDocumentHistory,
  updateDocumentStatus,
  getAssignedDocuments
};