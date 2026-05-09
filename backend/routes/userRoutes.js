const express = require('express');
const router = express.Router();
const { toggleBlacklist, getSystemTelemetry, createStaff, updateProfile, getStaff } = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// === NEW FEATURE: MEMBER ROUTE ===
router.put('/profile', protect, updateProfile); // Any logged-in user can update their own profile

// LIBRARIAN + ADMIN: Can blacklist students
router.patch('/:id/blacklist', protect, restrictTo('ADMIN', 'LIBRARIAN'), toggleBlacklist);

// === STRICT ADMIN ONLY ROUTES ===
// THE FIX: Expanded telemetry clearance to include LIBRARIANS
router.get('/telemetry', protect, restrictTo('ADMIN', 'LIBRARIAN'), getSystemTelemetry);

router.get('/staff', protect, restrictTo('ADMIN'), getStaff);
router.post('/staff', protect, restrictTo('ADMIN'), createStaff);

module.exports = router;