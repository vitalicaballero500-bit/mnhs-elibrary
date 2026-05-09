const express = require('express');
const router = express.Router();
const { addBook, getBooks, updateBook, toggleBookStatus } = require('../controllers/bookController');

// Import Middlewares
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// PUBLIC OR MEMBER ROUTES
// The catalog is fully public so guests can view the library inventory
router.get('/', getBooks); 

// === STRICT RBAC PROTECTED ROUTES ===
// Only Librarians and Admins can modify the vault.
// upload.single('coverImage') intercepts the image file and sends it to Cloudinary before the controller runs.

router.post('/', 
    protect, 
    restrictTo('ADMIN', 'LIBRARIAN'), 
    upload.single('coverImage'), 
    addBook
);

router.patch('/:id', 
    protect, 
    restrictTo('ADMIN', 'LIBRARIAN'), 
    upload.single('coverImage'), 
    updateBook
);

router.patch('/:id/status', 
    protect, 
    restrictTo('ADMIN', 'LIBRARIAN'), 
    toggleBookStatus
);

module.exports = router;