const express = require('express');
const {
  getDashboard,
  getInstitutes,
  createInstitute,
  updateInstitute,
  assignReviewer,
  assignAuditor,
  getReviewers,
  getAuditors,
  getReports,
  getUsers,
  updateUserStatus
} = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const { adminOnly } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Apply auth and admin-only middleware to all routes
router.use(authMiddleware);
router.use(adminOnly);

// Dashboard
router.get('/dashboard', getDashboard);

// Institute management
router.get('/institutes', getInstitutes);
router.post('/institutes', createInstitute);
router.put('/institutes/:id', updateInstitute);

// Assignment management
router.post('/assign-reviewer', assignReviewer);
router.post('/assign-auditor', assignAuditor);
router.get('/reviewers', getReviewers);
router.get('/auditors', getAuditors);

// User management
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);

// Reports
router.get('/reports', getReports);

module.exports = router;