const express = require('express');
const {
  getLogs,
  getUserLogs,
  getActivitySummary,
  exportLogs,
  cleanupLogs
} = require('../controllers/logController');
const authMiddleware = require('../middlewares/authMiddleware');
const { adminOnly, authorize } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// System logs (Admin only)
router.get('/', adminOnly, getLogs);
router.get('/summary', adminOnly, getActivitySummary);
router.post('/export', adminOnly, exportLogs);
router.delete('/cleanup', adminOnly, cleanupLogs);

// User logs (Admin or own logs)
router.get('/user/:userId', authorize('admin'), getUserLogs);

module.exports = router;