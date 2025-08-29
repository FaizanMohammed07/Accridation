const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: [true, 'Please link audit to document']
  },
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    required: [true, 'Please link audit to review']
  },
  auditor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auditor',
    required: [true, 'Please link audit to auditor']
  },
  institute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institute',
    required: [true, 'Please link audit to institute']
  },
  auditData: {
    reviewValidation: {
      accuracyScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      completenessScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      consistencyScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
      },
      validationComments: String
    },
    criteriaValidation: [{
      criteriaName: String,
      reviewerScore: Number,
      auditorScore: Number,
      variance: Number,
      acceptable: Boolean,
      auditorComments: String,
      evidenceValidated: Boolean
    }],
    complianceCheck: {
      standardsVerification: [{
        standard: String,
        version: String,
        reviewerAssessment: String,
        auditorVerification: String,
        compliant: Boolean,
        gaps: [String],
        recommendations: String
      }],
      overallCompliance: {
        type: String,
        enum: ['fully_compliant', 'mostly_compliant', 'partially_compliant', 'non_compliant'],
        required: true
      }
    },
    findings: [{
      category: {
        type: String,
        enum: ['critical', 'major', 'minor', 'observation', 'commendation']
      },
      description: String,
      evidence: String,
      impact: String,
      recommendation: String,
      timeline: String,
      responsible: String
    }],
    riskAssessment: {
      risks: [{
        description: String,
        probability: {
          type: String,
          enum: ['low', 'medium', 'high']
        },
        impact: {
          type: String,
          enum: ['low', 'medium', 'high']
        },
        mitigation: String
      }],
      overallRisk: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      }
    }
  },
  finalDecision: {
    outcome: {
      type: String,
      enum: ['approved', 'approved_with_conditions', 'rejected', 'requires_revision'],
      required: function() {
        return this.status === 'completed';
      }
    },
    finalScore: {
      type: Number,
      min: 0,
      max: 100
    },
    validity: {
      startDate: Date,
      endDate: Date,
      renewable: {
        type: Boolean,
        default: true
      }
    },
    conditions: [{
      description: String,
      dueDate: Date,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      }
    }],
    justification: {
      type: String,
      required: function() {
        return this.finalDecision && this.finalDecision.outcome;
      }
    }
  },
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'under_review', 'completed', 'on_hold'],
    default: 'assigned'
  },
  timeline: {
    assignedAt: {
      type: Date,
      default: Date.now
    },
    startedAt: Date,
    submittedAt: Date,
    completedAt: Date,
    dueDate: {
      type: Date,
      required: [true, 'Please set audit due date']
    }
  },
  quality: {
    thoroughness: {
      type: Number,
      min: 1,
      max: 5
    },
    accuracy: {
      type: Number,
      min: 1,
      max: 5
    },
    timeliness: {
      type: Number,
      min: 1,
      max: 5
    },
    notes: String
  },
  auditorSignature: {
    signed: {
      type: Boolean,
      default: false
    },
    signedAt: Date,
    digitalSignature: String,
    signatureIP: String
  },
  auditTrail: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed,
    ip: String,
    userAgent: String
  }],
  attachments: [{
    name: String,
    description: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for overall audit score
auditSchema.virtual('overallAuditScore').get(function() {
  if (!this.auditData.reviewValidation) return 0;
  const { accuracyScore, completenessScore, consistencyScore } = this.auditData.reviewValidation;
  return Math.round((accuracyScore + completenessScore + consistencyScore) / 3);
});

// Virtual for time spent on audit
auditSchema.virtual('timeSpent').get(function() {
  if (!this.timeline.completedAt || !this.timeline.startedAt) return null;
  return Math.round((this.timeline.completedAt - this.timeline.startedAt) / (1000 * 60 * 60)); // hours
});

// Virtual for days until due
auditSchema.virtual('daysUntilDue').get(function() {
  if (!this.timeline.dueDate) return null;
  return Math.ceil((this.timeline.dueDate - Date.now()) / (1000 * 60 * 60 * 24));
});

// Add to audit trail before saving
auditSchema.methods.addToTrail = function(action, performedBy, details, req) {
  this.auditTrail.push({
    action,
    performedBy,
    details,
    ip: req?.ip || 'system',
    userAgent: req?.get('User-Agent') || 'system'
  });
  return this.save();
};

// Index for efficient queries
auditSchema.index({ document: 1 });
auditSchema.index({ review: 1 });
auditSchema.index({ auditor: 1, status: 1 });
auditSchema.index({ institute: 1 });
auditSchema.index({ 'timeline.dueDate': 1 });
auditSchema.index({ status: 1, 'timeline.dueDate': 1 });

module.exports = mongoose.model('Audit', auditSchema);