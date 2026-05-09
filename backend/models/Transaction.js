const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    status: {
        type: String,
        enum: ['RESERVED', 'BORROWED', 'RETURNED', 'CANCELLED'],
        default: 'RESERVED',
        index: true 
    },
    reservationCode: {
        type: String,
        sparse: true,
        index: true 
    },
    requestedDays: {
        type: Number,
        required: true,
        min: [1, 'Must borrow for at least 1 day'],
        max: [31, 'Cannot exceed 31 days'], // UPGRADED TO 31 DAYS
        default: 7
    },
    reservedAt: {
        type: Date,
        default: Date.now
    },
    // === 🚨 THE FIX: DELETED THE TTL INDEX ===
    // This allows the Cron Job to process the mathematical return of the book
    // before the record is deleted.
    expiresAt: {
        type: Date
    },
    borrowedAt: {
        type: Date
    },
    dueDate: {
        type: Date
    },
    returnedAt: {
        type: Date
    },
    penaltyFee: {
        type: Number,
        default: 0
    },
    issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' 
    },
    receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' 
    },
    returnCondition: {
        type: String,
        enum: ['Excellent', 'Good', 'Fair', 'Damaged', 'Lost']
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);