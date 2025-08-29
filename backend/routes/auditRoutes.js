const express = require('express');
const {
  getAuditorDashboard,
  startAudit,
  updateAudit,
  submitAudit,
  getAudit,
  getDocumentAudits,
  addAuditFinding,
  updateComplianceCheck,
  validateReviewAssessment
} = require('../controllers/auditController');
const authMiddleware = require('../middlewares/authMiddleware');
const { authorize, auditorOnly } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Auditor dashboard
router.get('/dashboard', auditorOnly, getAuditorDashboard);

// Audit operations
router.post('/start/:documentId', auditorOnly, startAudit);
router.put('/:id', auditorOnly, updateAudit);
router.post('/:id/submit', auditorOnly, submitAudit);

// Audit actions
router.post('/:id/findings', auditorOnly, addAuditFinding);
router.put('/:id/compliance', auditorOnly, updateComplianceCheck);
router.post('/:id/validate-review', auditorOnly, validateReviewAssessment);

// View audits
router.get('/:id', authorize('admin', 'auditor', 'institute'), getAudit);
router.get('/document/:documentId', authorize('admin', 'auditor', 'institute'), getDocumentAudits);

module.exports = router;