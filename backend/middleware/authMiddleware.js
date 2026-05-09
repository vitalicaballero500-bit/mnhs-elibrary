const jwt = require('jsonwebtoken');
const User = require('../models/User');

// === GATEWAY 1: REQUIRE AUTHENTICATION ===
exports.protect = async (req, res, next) => {
    try {
        let token;

        // 1. Check for the secure HTTP-Only Cookie first
        if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        } 
        // 2. Fallback to Bearer header (prevents crashes during dev transitions)
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, token missing.' });
        }

        // Verify the token signature against our secret vault
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the user and attach them to the request object
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ message: 'Token valid, but user no longer exists.' });
        }

        if (!req.user.isActive) {
            return res.status(403).json({ message: 'Account suspended.' });
        }

        next(); // Allow them to proceed
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed or expired.' });
    }
};

// === GATEWAY 2: ROLE-BASED ACCESS CONTROL (RBAC) ===
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `RBAC Violation: Role ${req.user.role} is strictly forbidden.` 
            });
        }
        next();
    };
};