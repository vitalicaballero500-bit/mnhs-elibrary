const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const User = require('../models/User'); 
const mongoose = require('mongoose');
const { logSystemAction } = require('./systemController'); // <-- ELITE UPGRADE: The Tripwire
// 1. USER RESERVES A BOOK
exports.reserveBook = async (req, res) => {
    try {
        const { bookId, requestedDays = 7 } = req.body;
        const userId = req.user._id;

        const overdueBooks = await Transaction.findOne({ user: userId, status: 'BORROWED', dueDate: { $lt: new Date() } });
        const userProfile = await User.findById(userId);

        // 🚨 PHASE 1 SYNC: Changed totalPenaltyWaiver to totalFines
        if (overdueBooks || userProfile.totalFines > 0) {
            return res.status(403).json({ message: 'ACCOUNT SUSPENDED: You have an overdue book or unpaid penalties.', isSuspended: true });
        }

        const book = await Book.findOneAndUpdate(
            { _id: bookId, availableCopies: { $gt: 0 }, isActive: true },
            { $inc: { availableCopies: -1 } },
            { new: true } 
        );

        if (!book) return res.status(400).json({ message: 'Book is currently out of stock.' });

        const reservationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await Transaction.create({ user: userId, book: bookId, status: 'RESERVED', reservationCode, expiresAt, requestedDays });
        req.app.get('io').emit('inventory_updated');
        res.status(201).json({ message: 'Book reserved.', reservationCode, expiresAt });
    } catch (error) { res.status(500).json({ message: 'Reservation failed.', error: error.message }); }
};
// === Add this NEW function to transactionController.js ===

// === NEW FEATURE: ATOMIC BULK CHECKOUT (MASTER CODE EDITION) ===
exports.reserveBookBulk = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { items, requestedDays = 7 } = req.body; 
        const userId = req.user._id;

        const overdueBooks = await Transaction.findOne({ user: userId, status: 'BORROWED', dueDate: { $lt: new Date() } });
        const userProfile = await User.findById(userId);

        // 🚨 PHASE 1 SYNC: Changed totalPenaltyWaiver to totalFines
        if (overdueBooks || userProfile.totalFines > 0) {
            return res.status(403).json({ message: 'ACCOUNT SUSPENDED: Overdue books or unpaid penalties detected.', isSuspended: true });
        }

        const masterReservationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 
        
        for (const bookId of items) {
            const book = await Book.findOneAndUpdate(
                { _id: bookId, availableCopies: { $gt: 0 }, isActive: true },
                { $inc: { availableCopies: -1 } },
                { new: true, session } 
            );

            if (!book) throw new Error(`Out of stock or unavailable: Inventory mismatch detected.`);
            await Transaction.create([{ user: userId, book: bookId, status: 'RESERVED', reservationCode: masterReservationCode, requestedDays, expiresAt }], { session });
        }

        await session.commitTransaction();
        session.endSession();
        req.app.get('io').emit('inventory_updated');
        res.status(201).json({ tickets: [{ title: `Master Vault Key (${items.length} Assets)`, code: masterReservationCode, expiresAt }] });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error.message.includes('Out of stock')) return res.status(400).json({ message: 'Cart conflict: One or more books are out of stock.' });
        res.status(500).json({ message: 'Critical reservation failure.', error: error.message });
    }
};
// === PHASE 3 PREP: LIBRARIAN BULK RELEASE ===
exports.verifyAndReleaseBook = async (req, res) => {
    try {
        const { reservationCode } = req.body;
        
        // Use find() instead of findOne() to get the array of books
        const transactions = await Transaction.find({ reservationCode, status: 'RESERVED' })
            .populate('user', 'firstName lastName email classification');

        if (!transactions || transactions.length === 0) return res.status(404).json({ message: 'Invalid or expired Master Code.' });

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + transactions[0].requestedDays);

        // Process the release of all physical assets simultaneously
        for (let tx of transactions) {
            tx.status = 'BORROWED';
            tx.borrowedAt = Date.now();
            tx.dueDate = dueDate;
            tx.issuedBy = req.user._id; 
            tx.reservationCode = undefined; 
            tx.expiresAt = undefined;
            await tx.save();
        }

        // 🚨 CAMERA TRIPWIRE
        await logSystemAction(req.user._id, 'ASSET_MODIFIED', `Authorized release of ${transactions.length} assets for Master Code: ${reservationCode}`);

        res.status(200).json({ 
            message: `${transactions.length} assets securely released.`, 
            borrower: transactions[0].user, 
            dueDate 
        });
    } catch (error) {
        res.status(500).json({ message: 'Verification failed.', error: error.message });
    }
};
// 3. LIBRARIAN RECEIVES RETURNED BOOK
exports.returnBook = async (req, res) => {
    try {
        const { transactionId, returnCondition = 'Good' } = req.body;
        const transaction = await Transaction.findOne({ _id: transactionId, status: 'BORROWED' }).populate('book');
        if (!transaction) return res.status(404).json({ message: 'Active borrowing record not found.' });

        transaction.status = 'RETURNED';
        transaction.returnedAt = Date.now();
        transaction.receivedBy = req.user._id; 
        transaction.returnCondition = returnCondition;

        // === 🚨 PHASE 2 UPGRADE: LOST BOOK PRICING ===
        if (returnCondition === 'Lost') {
            transaction.penaltyFee += (transaction.book.price || 500); 
        } else {
            await Book.findByIdAndUpdate(transaction.book._id, { $inc: { availableCopies: 1 } });
        }

        await transaction.save();

        req.app.get('io').emit('inventory_updated'); 
        req.app.get('io').emit('radar_updated'); 

        // 🚨 CAMERA TRIPWIRE
        await logSystemAction(req.user._id, 'ASSET_MODIFIED', `Processed return (Condition: ${returnCondition}) for Asset: ${transaction.book.title}`);

        res.status(200).json({ 
            message: returnCondition === 'Lost' ? 'Asset marked as LOST. Replacement cost billed.' : 'Book returned.', 
            penaltyFee: transaction.penaltyFee 
        });
    } catch (error) {
        res.status(500).json({ message: 'Return failed.', error: error.message });
    }
};

// 4. GET ALL ACTIVE BORROWINGS (Radar)
exports.getActiveBorrowings = async (req, res) => {
    try {
        const activeTransactions = await Transaction.find({ status: 'BORROWED' })
            // === ADDED FULL KYC FIELDS HERE ===
            .populate('user', 'firstName lastName email suffix age gender address contactNumber classification isActive') 
            .populate('book', 'title coverImageUrl')
            .sort({ dueDate: 1 });
        res.status(200).json(activeTransactions);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch radar data.', error: error.message });
    }
};
// === PHASE 3 PREP: LIBRARIAN LOOKUP (MULTI-ASSET) ===
exports.lookupReservation = async (req, res) => {
    try {
        const { code } = req.params;
        
        // THE FIX: Use find() instead of findOne() to pull the whole array
        const transactions = await Transaction.find({ reservationCode: code, status: 'RESERVED' })
            .populate('user', 'firstName lastName suffix age gender address contactNumber classification')
            .populate('book', 'title coverImageUrl shelfLocation isbn');

        if (!transactions || transactions.length === 0) {
            return res.status(404).json({ message: 'Invalid or expired Master Code.' });
        }

        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Lookup failed.', error: error.message });
    }
};
// === THE ELITE FIX: DYNAMIC LEDGER PAGINATION ===
exports.getTransactionHistory = async (req, res) => {
    try {
        // 1. Extract dynamic pagination variables from the frontend request (with safe defaults)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20; // 20 items per page is standard for dashboards
        const skip = (page - 1) * limit;

        // 2. Fetch the specific slice of data
        const history = await Transaction.find({ status: 'RETURNED' })
            // 🚨 THE FIX: PULL FULL KYC CREDENTIALS FOR THE DOSSIER MODAL
            .populate('user', 'firstName lastName email contactNumber address age gender classification isActive')
            .populate('book', 'title isbn')
            .populate('receivedBy', 'firstName lastName')
            .sort({ returnedAt: -1 })
            .skip(skip)   // Offset the results based on the page
            .limit(limit); // Cap the results for this specific page

        // 3. Count total historical records for frontend pagination math (Total Pages)
        const totalRecords = await Transaction.countDocuments({ status: 'RETURNED' });

        // 4. Return the data AND the metadata payload
        res.status(200).json({
            transactions: history,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit),
            totalRecords
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch paginated ledger.', error: error.message });
    }
};
// === NEW FEATURE: MEMBER COMMAND CENTER DATA ===
exports.getMyTransactions = async (req, res) => {
    try {
        // Fetch all transactions belonging to the currently logged-in user
        const transactions = await Transaction.find({ user: req.user._id })
            .populate('book', 'title coverImageUrl author')
            .sort({ reservedAt: -1 }); // Newest first
            
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch your vault data.', error: error.message });
    }
};
// === NEW FEATURE: CASHIER SYSTEM (SETTLE FINES) ===
exports.settleFine = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });

        // Wipe the debt to zero
        transaction.penaltyFee = 0; 
        await transaction.save();

        // === ELITE UPGRADE: TRIGGER THE ALARM ===
        // This runs silently in the background. The user never feels the delay.
        await logSystemAction(
            req.user._id, 
            'FINANCIAL_OVERRIDE', 
            `Manually cleared a cash fine for Transaction ID: ${transaction._id}`
        );

        res.status(200).json({ message: 'Payment secured. Fine settled and account cleared.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to process payment.', error: error.message });
    }
};