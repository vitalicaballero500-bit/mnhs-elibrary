const User = require('../models/User');
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const bcrypt = require('bcryptjs');
const { logSystemAction } = require('./systemController');

// 1. TOGGLE BLACKLIST (Soft Delete)
exports.toggleBlacklist = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        if (user.role === 'ADMIN') return res.status(403).json({ message: 'CRITICAL: Cannot blacklist a Master Admin.' });

        user.isActive = !user.isActive;
        await user.save();
        // 🚨 CAMERA TRIPWIRE
        await logSystemAction(req.user._id, 'SECURITY_CLEARANCE', `Clearance updated for ${user.email} to: ${user.isActive ? 'Active' : 'Blacklisted'}`);
        res.status(200).json({ message: `User successfully ${user.isActive ? 'Restored to Active' : 'Blacklisted'}.` });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update user status.', error: error.message });
    }
};

// === PHASE 9.6: ADMIN GOD MODE (BULLETPROOF TELEMETRY) ===

// 2. GET SYSTEM TELEMETRY (Upgraded with Chart Aggregation)
exports.getSystemTelemetry = async (req, res) => {
    try {
        const allBooks = await Book.find({});
        const totalBooks = allBooks.reduce((sum, book) => sum + (book.totalCopies || 0), 0);
        const activeBorrowers = await Transaction.countDocuments({ status: 'BORROWED' });
        const penalizedTransactions = await Transaction.find({ penaltyFee: { $gt: 0 } });
        const totalPenalties = penalizedTransactions.reduce((sum, tx) => sum + (tx.penaltyFee || 0), 0);
        const totalUsers = await User.countDocuments({ role: 'MEMBER' });

        // === THE FIX: DATA AGGREGATION FOR RECHARTS ===
        // This queries the database to group all books by their genre to build the Donut Chart
        const genreDistribution = await Book.aggregate([
            { $group: { _id: "$genre", value: { $sum: 1 } } }, 
            { $project: { name: "$_id", value: 1, _id: 0 } },
            { $sort: { value: -1 } }
        ]);

        res.status(200).json({ 
            totalBooks, activeBorrowers, totalPenalties, totalUsers,
            genreDistribution // Pushing the chart data to the frontend
        });
    } catch (error) {
        console.error("Backend Telemetry Error:", error);
        res.status(500).json({ message: 'Telemetry failed.', error: error.message });
    }
};

// 3. CREATE STAFF ACCOUNT (Bypassing Public Reg)
exports.createStaff = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already exists in the system.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // We inject generic KYC data because Staff don't borrow books
        await User.create({
            firstName, lastName, email, password: hashedPassword, role,
            classification: 'ADULT', 
            age: 99, 
            gender: 'Prefer not to say', 
            address: 'Staff Headquarters', 
            contactNumber: '09999999999' 
        });

        // 🚨 CAMERA TRIPWIRE
        await logSystemAction(req.user._id, 'SECURITY_CLEARANCE', `Forged new ${role} credentials for: ${email}`);

        res.status(201).json({ message: `${role} account successfully forged.` });
    } catch (error) {
        res.status(500).json({ message: 'Staff creation failed.', error: error.message });
    }
};
// === NEW FEATURE: SECURE KYC PROFILE UPDATE ===
exports.updateProfile = async (req, res) => {
    try {
        // THE FIX: STRICT DESTRUCTURING (RBAC Shield)
        // We intentionally ignore 'role', 'isActive', and 'totalPenaltyWaiver'
        const { firstName, lastName, suffix, age, gender, address, contactNumber } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { firstName, lastName, suffix, age, gender, address, contactNumber },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ message: 'User not found.' });

        res.status(200).json({ message: 'Identity credentials securely updated.', user: updatedUser });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(' | ') });
        }
        res.status(500).json({ message: 'Profile update failed.', error: error.message });
    }
};
// === THE FIX: GET ALL STAFF MEMBERS ===
exports.getStaff = async (req, res) => {
    try {
        // Fetch everyone who is an ADMIN or LIBRARIAN (Ignore Students/Members)
        const staff = await User.find({ role: { $in: ['ADMIN', 'LIBRARIAN'] } })
            .select('-password') // Never send passwords to the frontend
            .sort({ role: 1, lastName: 1 }); // Sort Admins first, then alphabetically
            
        res.status(200).json(staff);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve staff list.', error: error.message });
    }
};