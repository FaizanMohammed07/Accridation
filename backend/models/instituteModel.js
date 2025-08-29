const mongoose = require('mongoose');

const instituteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add institute name'],
    trim: true,
    maxlength: [100, 'Institute name cannot be more than 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Please add institute code'],
    unique: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['university', 'college', 'school', 'training_center', 'other'],
    required: [true, 'Please specify institute type']
  },
  accreditationLevel: {
    type: String,
    enum: ['basic', 'intermediate', 'advanced', 'premium'],
    default: 'basic'
  },
  contactInfo: {
    email: {
      type: String,
      required: [true, 'Please add contact email'],
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    phone: {
      type: String,
      required: [true, 'Please add contact phone']
    },
    website: {
      type: String,
      match: [
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
        'Please add a valid website URL'
      ]
    }
  },
  address: {
    street: {
      type: String,
      required: [true, 'Please add street address']
    },
    city: {
      type: String,
      required: [true, 'Please add city']
    },
    state: {
      type: String,
      required: [true, 'Please add state']
    },
    country: {
      type: String,
      required: [true, 'Please add country']
    },
    zipCode: {
      type: String,
      required: [true, 'Please add zip code']
    }
  },
  administrator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please assign an administrator']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_approval'],
    default: 'pending_approval'
  },
  accreditationStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'under_review', 'auditing', 'approved', 'rejected', 'expired'],
    default: 'not_started'
  },
  establishedDate: {
    type: Date,
    required: [true, 'Please add establishment date']
  },
  studentCount: {
    type: Number,
    min: [0, 'Student count cannot be negative']
  },
  staffCount: {
    type: Number,
    min: [0, 'Staff count cannot be negative']
  },
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  certifications: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date,
    certificateUrl: String
  }],
  complianceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  lastAuditDate: {
    type: Date
  },
  nextAuditDue: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total documents
instituteSchema.virtual('totalDocuments').get(function() {
  return this.documents.length;
});

// Index for faster searches
instituteSchema.index({ code: 1, status: 1 });
instituteSchema.index({ 'contactInfo.email': 1 });
instituteSchema.index({ accreditationStatus: 1 });

module.exports = mongoose.model('Institute', instituteSchema);