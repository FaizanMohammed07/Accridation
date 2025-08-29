const express = require('express');
const {
  getReviewerDashboard,
  startReview,
  updateReview,
  submitReview,
  getReview,
  getDocumentReviews
} = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorize, reviewerOnly, adminOnly } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Reviewer dashboard
router.get('/dashboard', reviewerOnly, getReviewerDashboard);

// Review operations
router.post('/start/:documentId', reviewerOnly, startReview);
router.put('/:id', reviewerOnly, updateReview);
router.post('/:id/submit', reviewerOnly, submitReview);

// View reviews
router.get('/:id', authorize('admin', 'reviewer', 'auditor', 'institute'), getReview);
router.get('/document/:documentId', authorize('admin', 'reviewer', 'auditor', 'institute'), getDocumentReviews);

module.exports = router;