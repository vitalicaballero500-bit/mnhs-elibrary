const express = require('express');
const router = express.Router();

// Import the controllers
const { register, login, logout, verifySession } = require('../controllers/authController');

// Import the security middleware
const { protect } = require('../middleware/authMiddleware');

// Define the routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// === THE ELITE FIX: SILENT VERIFICATION PING ===
// This route is protected. It will violently reject the request if the HTTP-Only cookie is missing/tampered.
router.get('/verify', protect, verifySession);

module.exports = router;