const mongoose = require('mongoose');

const auditorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please link to user account']
  },
  licenseNumber: {
    type: String,
    required: [true, 'Please add auditor license number'],
    unique: true
  },
  specialization: [{
    type: String,
    enum: ['financial', 'academic', 'compliance', 'quality_assurance', 'infrastructure', 'governance'],
    required: [true, 'Please add at least one specialization']
  }],
  qualifications: [{
    certification: {
      type: String,
      required: true
    },
    issuedBy: {
      type: String,
      required: true
    },
    issuedDate: {
      type: Date,
      required: true
    },
    expiryDate: {
      type: Date,
      required: true
    },
    certificateNumber: String
  }],
  experience: {
    type: Number,
    required: [true, 'Please add years of auditing experience'],
    min: [0, 'Experience cannot be negative']
  },
  assignedDocuments: [{
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review'
    },
    assignedDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'completed'],
      default: 'assigned'
    },
    dueDate: {
      type: Date
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  }],
  completedAudits: {
    type: Number,
    default: 0
  },
  averageAuditTime: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  availability: {
    type: String,
    enum: ['available', 'busy', 'unavailable'],
    default: 'available'
  },
  workload: {
    current: {
      type: Number,
      default: 0
    },
    maximum: {
      type: Number,
      default: 8
    }
  },
  auditHistory: [{
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    institute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institute'
    },
    completedDate: Date,
    outcome: {
      type: String,
      enum: ['approved', 'rejected', 'conditional_approval']
    },
    score: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  preferences: {
    instituteTypes: [{
      type: String,
      enum: ['university', 'college', 'school', 'training_center', 'other']
    }],
    documentTypes: [{
      type: String
    }],
    maxSimultaneousAudits: {
      type: Number,
      default: 5
    }
  },
  performance: {
    accuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    efficiency: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    consistencyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for current workload percentage
auditorSchema.virtual('workloadPercentage').get(function() {
  return Math.round((this.workload.current / this.workload.maximum) * 100);
});

// Virtual for availability status based on workload
auditorSchema.virtual('isAvailable').get(function() {
  return this.availability === 'available' && this.workload.current < this.workload.maximum;
});

// Virtual for overall performance score
auditorSchema.virtual('overallPerformance').get(function() {
  const { accuracy, efficiency, consistencyScore } = this.performance;
  return Math.round((accuracy + efficiency + consistencyScore) / 3);
});

// Index for efficient queries
auditorSchema.index({ 'user': 1 });
auditorSchema.index({ 'licenseNumber': 1 });
auditorSchema.index({ 'specialization': 1 });
auditorSchema.index({ 'availability': 1 });

module.exports = mongoose.model('Auditor', auditorSchema);