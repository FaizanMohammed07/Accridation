const mongoose = require('mongoose');

const reviewerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please link to user account']
  },
  specialization: [{
    type: String,
    enum: ['academic', 'technical', 'administrative', 'financial', 'infrastructure', 'quality_assurance'],
    required: [true, 'Please add at least one specialization']
  }],
  qualifications: [{
    degree: {
      type: String,
      required: true
    },
    institution: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    field: {
      type: String,
      required: true
    }
  }],
  experience: {
    type: Number,
    required: [true, 'Please add years of experience'],
    min: [0, 'Experience cannot be negative']
  },
  certifications: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date,
    certificateUrl: String
  }],
  assignedDocuments: [{
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
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
    }
  }],
  completedReviews: {
    type: Number,
    default: 0
  },
  averageReviewTime: {
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
      default: 10
    }
  },
  preferences: {
    instituteTypes: [{
      type: String,
      enum: ['university', 'college', 'school', 'training_center', 'other']
    }],
    documentTypes: [{
      type: String
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for current workload percentage
reviewerSchema.virtual('workloadPercentage').get(function() {
  return Math.round((this.workload.current / this.workload.maximum) * 100);
});

// Virtual for availability status based on workload
reviewerSchema.virtual('isAvailable').get(function() {
  return this.availability === 'available' && this.workload.current < this.workload.maximum;
});

// Index for efficient queries
reviewerSchema.index({ 'user': 1 });
reviewerSchema.index({ 'specialization': 1 });
reviewerSchema.index({ 'availability': 1 });

module.exports = mongoose.model('Reviewer', reviewerSchema);