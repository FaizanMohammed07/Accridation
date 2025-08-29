const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: [true, 'Please link review to document']
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reviewer',
    required: [true, 'Please link review to reviewer']
  },
  institute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: [true, 'Please link review to institute']
  },
  reviewData: {
    overallScore: {
      type: Number,
      required: [true, 'Please provide overall score'],
      min: 0,
      max: 100
    },
    criteria: [{
      name: {
        type: String,
        required: true
      },
      score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      weight: {
        type: Number,
        required: true,
        min: 0,
        max: 1
      },
      comments: String,
      evidence: [{
        description: String,
        pageReference: String,
        attachmentUrl: String
      }]
    }],
    strengths: [{
      area: String,
      description: String,
      impact: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    }],
    weaknesses: [{
      area: String,
      description: String,
      severity: {
        type: String,
        enum: ['minor', 'moderate', 'major', 'critical']
      },
      recommendations: String,
      requiredAction: {
        type: String,
        enum: ['immediate', 'short_term', 'long_term', 'optional']
      }
    }],
    recommendations: [{
      category: String,
      description: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      timeframe: String,
      expectedOutcome: String
    }]
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_audit', 'approved', 'returned_for_revision'],
    default: 'draft'
  },
  timeline: {
    startedAt: {
      type: Date,
      default: Date.now
    },
    submittedAt: Date,
    completedAt: Date,
    dueDate: {
      type: Date,
      required: [true, 'Please set review due date']
    }
  },
  compliance: {
    standardsChecked: [{
      standard: String,
      version: String,
      compliance: {
        type: String,
        enum: ['compliant', 'non_compliant', 'partial', 'not_applicable']
      },
      notes: String
    }],
    overallCompliance: {
      type: String,
      enum: ['compliant', 'non_compliant', 'conditional'],
      default: 'conditional'
    }
  },
  feedback: {
    toInstitute: String,
    confidentialNotes: String,
    followUpRequired: {
      type: Boolean,
      default: false
    },
    followUpDate: Date
  },
  attachments: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reviewerSignature: {
    signed: {
      type: Boolean,
      default: false
    },
    signedAt: Date,
    digitalSignature: String
  },
  revisionHistory: [{
    version: Number,
    modifiedAt: Date,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changes: String,
    reason: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for review completion percentage
reviewSchema.virtual('completionPercentage').get(function() {
  if (!this.reviewData.criteria || this.reviewData.criteria.length === 0) return 0;
  
  const completedCriteria = this.reviewData.criteria.filter(c => c.score !== undefined).length;
  return Math.round((completedCriteria / this.reviewData.criteria.length) * 100);
});

// Virtual for time spent on review
reviewSchema.virtual('timeSpent').get(function() {
  if (!this.timeline.completedAt || !this.timeline.startedAt) return null;
  return Math.round((this.timeline.completedAt - this.timeline.startedAt) / (1000 * 60 * 60)); // hours
});

// Virtual for days until due
reviewSchema.virtual('daysUntilDue').get(function() {
  if (!this.timeline.dueDate) return null;
  return Math.ceil((this.timeline.dueDate - Date.now()) / (1000 * 60 * 60 * 24));
});

// Index for efficient queries
reviewSchema.index({ document: 1 });
reviewSchema.index({ reviewer: 1, status: 1 });
reviewSchema.index({ institute: 1 });
reviewSchema.index({ 'timeline.dueDate': 1 });
reviewSchema.index({ status: 1, 'timeline.dueDate': 1 });

module.exports = mongoose.model('Review', reviewSchema);