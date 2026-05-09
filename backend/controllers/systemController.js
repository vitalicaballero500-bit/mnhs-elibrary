const SystemLog = require('../models/SystemLog');

// === NEW FEATURE: THE GOD VIEW (READ-ONLY) ===
// Fetches the immutable audit trail for the Master Admin
exports.getAuditLogs = async (req, res) => {
    try {
        const logs = await SystemLog.find()
            .populate('performedBy', 'firstName lastName role')
            .sort({ timestamp: -1 })
            .limit(100); // Last 100 system actions
            
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to access security logs.', error: error.message });
    }
};

// === INTERNAL MICROSERVICE ===
// This is not a route. It's a helper function our other controllers will call silently.
exports.logSystemAction = async (userId, actionType, description) => {
    try {
        await SystemLog.create({
            performedBy: userId,
            actionType,
            description
        });
        console.log(`🔒 [AUDIT LOG]: ${actionType} - ${description}`);
    } catch (error) {
        console.error('❌ [AUDIT FAILURE]: Could not write to system log.', error.message);
    }
};