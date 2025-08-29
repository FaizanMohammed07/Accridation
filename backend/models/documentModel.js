const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add document title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add document description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  type: {
    type: String,
    enum: ['accreditation_application', 'financial_report', 'academic_report', 'infrastructure_report', 'compliance_certificate', 'quality_manual', 'other'],
    required: [true, 'Please specify document type']
  },
  category: {
    type: String,
    enum: ['mandatory', 'optional', 'supporting'],
    default: 'mandatory'
  },
  institute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: [true, 'Please link document to institute']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please specify who uploaded the document']
  },
  fileInfo: {
    originalName: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    cloudinaryUrl: {
      type: String,
      required: true
    },
    cloudinaryId: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['uploaded', 'assigned_for_review', 'under_review', 'review_completed', 'assigned_for_audit', 'under_audit', 'audit_completed', 'approved', 'rejected', 'revision_required'],
    default: 'uploaded'
  },
  assignedReviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reviewer'
  },
  assignedAuditor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auditor'
  },
  assignedBy: {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    auditor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  assignmentDates: {
    reviewerAssigned: Date,
    auditorAssigned: Date
  },
  dueDates: {
    review: Date,
    audit: Date,
    final: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    version: Number,
    fileName: String,
    cloudinaryUrl: String,
    cloudinaryId: String,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String
  }],
  tags: [{
    type: String,
    trim: true
  }],
  compliance: {
    requirements: [{
      name: String,
      status: {
        type: String,
        enum: ['pending', 'met', 'not_met', 'partial'],
        default: 'pending'
      },
      notes: String
    }],
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  workflow: {
    currentStage: {
      type: String,
      enum: ['upload', 'review_assignment', 'review', 'audit_assignment', 'audit', 'final_decision'],
      default: 'upload'
    },
    stages: [{
      name: String,
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'skipped'],
        default: 'pending'
      },
      startedAt: Date,
      completedAt: Date,
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      notes: String
    }]
  },
  notifications: [{
    type: {
      type: String,
      enum: ['assignment', 'deadline_reminder', 'status_change', 'approval', 'rejection']
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  }],
  metadata: {
    checksum: String,
    lastModified: Date,
    accessCount: {
      type: Number,
      default: 0
    },
    downloadCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for file size in human readable format
documentSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.fileInfo.fileSize;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for days since upload
documentSchema.virtual('daysSinceUpload').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Index for efficient queries
documentSchema.index({ institute: 1, status: 1 });
documentSchema.index({ assignedReviewer: 1, status: 1 });
documentSchema.index({ assignedAuditor: 1, status: 1 });
documentSchema.index({ 'dueDates.review': 1 });
documentSchema.index({ 'dueDates.audit': 1 });

module.exports = mongoose.model('Document', documentSchema);