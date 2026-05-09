const express = require('express');
const router = express.Router();

const { 
    reserveBook, 
    reserveBookBulk, 
    verifyAndReleaseBook, 
    returnBook, 
    getActiveBorrowings,
    lookupReservation,
    getMyTransactions,
    getTransactionHistory,
    settleFine // <--- THE FIX: Add this missing import!
} = require('../controllers/transactionController');

const { protect, restrictTo } = require('../middleware/authMiddleware');

router.post('/reserve', protect, reserveBook);
router.post('/reserve-bulk', protect, reserveBookBulk);
router.get('/my-vault', protect, getMyTransactions); 
router.post('/:id/settle-fine', protect, restrictTo('ADMIN', 'LIBRARIAN'), settleFine);


// Librarian & Admin Routes
router.get('/lookup/:code', protect, restrictTo('ADMIN', 'LIBRARIAN'), lookupReservation); 
router.post('/verify', protect, restrictTo('ADMIN', 'LIBRARIAN'), verifyAndReleaseBook);
router.post('/return', protect, restrictTo('ADMIN', 'LIBRARIAN'), returnBook);
router.get('/active', protect, restrictTo('ADMIN', 'LIBRARIAN'), getActiveBorrowings);
router.get('/history', protect, restrictTo('ADMIN', 'LIBRARIAN'), getTransactionHistory); // <-- THE FIX: Wired up the endpoint

module.exports = router;