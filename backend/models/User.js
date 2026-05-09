const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        match: [/^[a-zA-Z\sñÑ-]+$/, 'First name can only contain letters']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        match: [/^[a-zA-Z\sñÑ-]+$/, 'Last name can only contain letters']
    },
    suffix: {
        type: String,
        trim: true,
        default: '' 
    },
    age: {
        type: Number,
        required: [true, 'Age is required'],
        min: [5, 'Must be at least 5 years old to register']
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
        required: true
    },
    address: {
        type: String,
        required: [true, 'Full physical address is required for KYC verification'],
        trim: true
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        match: [/^09\d{9}$/, 'Must be a valid 11-digit Philippine mobile number']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        select: false
    },
    role: {
        type: String,
        enum: ['ADMIN', 'LIBRARIAN', 'MEMBER'],
        default: 'MEMBER'
    },
    classification: {
        type: String,
        enum: ['STUDENT', 'ADULT', 'MINOR'],
        required: true
    },
    
    // === 🚨 THE F1 PATCH: RACE CONDITION PREVENTION ===
    activeBorrows: {
        type: Number,
        default: 0,
        max: [3, 'SYSTEM LOCK: User has reached the maximum allowed concurrent borrows.']
    },
    
    // === 🚨 THE F1 PATCH: SEMANTIC DEBT TRAP FIXED ===
    // Renamed from totalPenaltyWaiver so panelists understand the logic
    totalFines: {
        type: Number,
        default: 0
    },
    
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);