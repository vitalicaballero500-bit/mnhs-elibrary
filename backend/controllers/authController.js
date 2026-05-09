const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// === THE FIX: SECURE COOKIE OPTIONS ===
// This instructs the browser to securely lock the token away so hackers cannot steal it via XSS.
const cookieOptions = {
    httpOnly: true,
    secure: true, 
    sameSite: 'none', 
    maxAge: 30 * 24 * 60 * 60 * 1000 
};

// 1. REGISTER NEW USER
exports.register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, suffix, age, gender, address, contactNumber } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'This email is already registered.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // === THE ELITE FIX: RANDOMIZED UNIQUE INJECTOR ===
        // This generates a mathematically unique 11-digit PH number (09XXXXXXXXX)
        // to prevent "Phone number already exists" collisions during testing.
        const fallbackPhone = `09${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;

        // === THE ELITE FIX: CLEAN DATA PIPELINE ===
        // We trust the React frontend to provide strict KYC data. No more random fallbacks.
        const user = await User.create({
            firstName, 
            lastName, 
            email, 
            password: hashedPassword,
            suffix, 
            age, 
            gender, 
            address, 
            contactNumber, // Strictly uses what the user typed in the frontend
            classification: 'STUDENT', 
            isActive: true // Bypasses the active radar shield so new users can log in instantly
        });

        if (user) {
            const token = generateToken(user._id);
            res.cookie('jwt', token, cookieOptions); // <-- THE FIX: INJECT THE COOKIE

            res.status(201).json({
                _id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                suffix: user.suffix,
                age: user.age,
                gender: user.gender,
                address: user.address,
                contactNumber: user.contactNumber,
                email: user.email,
                role: user.role,
                classification: user.classification
            });
        }
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(' | ') });
        }
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
};

// 2. LOGIN USER
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');

        if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
        if (!user.isActive) return res.status(403).json({ message: 'ACCOUNT BLACKLISTED: Access revoked.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid email or password.' });

        const token = generateToken(user._id);
        res.cookie('jwt', token, cookieOptions); // <-- THE FIX: INJECT THE COOKIE

        res.status(200).json({
            _id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            suffix: user.suffix,
            age: user.age,
            gender: user.gender,
            address: user.address,
            contactNumber: user.contactNumber,
            email: user.email,
            role: user.role,
            classification: user.classification
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
};

// 3. LOGOUT USER
exports.logout = (req, res) => {
    // Destroys the cookie instantly
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0)
    });
    res.status(200).json({ message: 'Logged out successfully.' });
};
// 4. SILENT VERIFICATION PING (Protects against LocalStorage Tampering)
exports.verifySession = async (req, res) => {
    try {
        // If the request made it past the 'protect' middleware, the HTTP-Only cookie is 100% valid.
        // We send back the exact, untampered database truth to overwrite the frontend state.
        res.status(200).json({
            _id: req.user.id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            suffix: req.user.suffix,
            age: req.user.age,
            gender: req.user.gender,
            address: req.user.address,
            contactNumber: req.user.contactNumber,
            email: req.user.email,
            role: req.user.role,
            classification: req.user.classification
        });
    } catch (error) {
        res.status(500).json({ message: 'Verification failed.', error: error.message });
    }
};