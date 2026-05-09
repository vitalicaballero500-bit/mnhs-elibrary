const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/systemController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// === STRICT ADMIN ONLY ROUTE ===
// Librarians are NOT allowed to view the audit trail, as it monitors them.
router.get('/audit-logs', protect, restrictTo('ADMIN'), getAuditLogs);

module.exports = router;