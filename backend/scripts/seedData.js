const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/userModel');
const Institute = require('../models/instituteModel');
const Reviewer = require('../models/reviewerModel');
const Auditor = require('../models/auditorModel');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/accreditech');
    console.log('📊 Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Institute.deleteMany({});
    await Reviewer.deleteMany({});
    await Auditor.deleteMany({});

    // Create admin user
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@accreditech.com',
      password: 'SecureAdmin123!',
      role: 'admin',
      status: 'active',
      phone: '+1-555-0100',
      address: {
        street: '123 Admin Street',
        city: 'Tech City',
        state: 'California',
        country: 'USA',
        zipCode: '90210'
      }
    });

    // Create institute admin user
    const instituteUser = await User.create({
      name: 'University Administrator',
      email: 'admin@techuniversity.edu',
      password: 'UniAdmin123!',
      role: 'institute',
      status: 'active',
      phone: '+1-555-0200'
    });

    // Create reviewer user
    const reviewerUser = await User.create({
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@accreditech.com',
      password: 'Reviewer123!',
      role: 'reviewer',
      status: 'active',
      phone: '+1-555-0300'
    });

    // Create auditor user
    const auditorUser = await User.create({
      name: 'Michael Chen',
      email: 'michael.chen@accreditech.com',
      password: 'Auditor123!',
      role: 'auditor',
      status: 'active',
      phone: '+1-555-0400'
    });

    // Create institute
    const institute = await Institute.create({
      name: 'Tech University',
      code: 'TECH001',
      type: 'university',
      accreditationLevel: 'intermediate',
      contactInfo: {
        email: 'info@techuniversity.edu',
        phone: '+1-555-0200',
        website: 'https://techuniversity.edu'
      },
      address: {
        street: '456 University Avenue',
        city: 'Tech City',
        state: 'California',
        country: 'USA',
        zipCode: '90211'
      },
      administrator: instituteUser._id,
      status: 'active',
      establishedDate: new Date('2000-01-01'),
      studentCount: 5000,
      staffCount: 500
    });

    // Create reviewer profile
    const reviewer = await Reviewer.create({
      user: reviewerUser._id,
      specialization: ['academic', 'quality_assurance'],
      qualifications: [{
        degree: 'PhD in Education',
        institution: 'Stanford University',
        year: 2015,
        field: 'Educational Administration'
      }],
      experience: 8,
      certifications: [{
        name: 'Certified Education Reviewer',
        issuedBy: 'National Accreditation Board',
        issuedDate: new Date('2020-01-01'),
        expiryDate: new Date('2025-01-01')
      }],
      workload: {
        current: 0,
        maximum: 10
      },
      preferences: {
        instituteTypes: ['university', 'college'],
        documentTypes: ['academic_report', 'quality_manual']
      }
    });

    // Create auditor profile
    const auditor = await Auditor.create({
      user: auditorUser._id,
      licenseNumber: 'AUD2023001',
      specialization: ['academic', 'compliance', 'quality_assurance'],
      qualifications: [{
        certification: 'Certified Professional Auditor',
        issuedBy: 'International Auditing Association',
        issuedDate: new Date('2018-06-01'),
        expiryDate: new Date('2026-06-01'),
        certificateNumber: 'CPA-2018-001'
      }],
      experience: 12,
      workload: {
        current: 0,
        maximum: 8
      },
      preferences: {
        instituteTypes: ['university', 'college'],
        maxSimultaneousAudits: 5
      }
    });

    console.log('🌱 Seed data created successfully!');
    console.log('👤 Admin User:', adminUser.email, '/ SecureAdmin123!');
    console.log('🏫 Institute User:', instituteUser.email, '/ UniAdmin123!');
    console.log('👨‍🏫 Reviewer User:', reviewerUser.email, '/ Reviewer123!');
    console.log('👨‍💼 Auditor User:', auditorUser.email, '/ Auditor123!');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
};

const runSeed = async () => {
  await connectDB();
  await seedUsers();
  await mongoose.disconnect();
  console.log('🏁 Seeding completed and database disconnected');
};

if (require.main === module) {
  runSeed();
}

module.exports = { seedUsers };