const express = require('express');
const {
  uploadDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
  getDocumentHistory,
  updateDocumentStatus,
  getAssignedDocuments
} = require('../controllers/documentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorize, adminOnly, instituteOnly, reviewerOrAuditor } = require('../middlewares/roleMiddleware');
const { uploadSingle, handleUploadError } = require('../middlewares/uploadMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Document upload (Institute only)
router.post('/upload', instituteOnly, uploadSingle, handleUploadError, uploadDocument);

// Get documents (role-based filtering applied in controller)
router.get('/', getDocuments);

// Get assigned documents (Reviewer/Auditor only)
router.get('/assigned', reviewerOrAuditor, getAssignedDocuments);

// Single document operations
router.get('/:id', getDocument);
router.put('/:id', authorize('admin', 'institute'), updateDocument);
router.delete('/:id', authorize('admin', 'institute'), deleteDocument);
router.get('/:id/download', downloadDocument);
router.get('/:id/history', getDocumentHistory);

// Admin-only operations
router.put('/:id/status', adminOnly, updateDocumentStatus);

module.exports = router;