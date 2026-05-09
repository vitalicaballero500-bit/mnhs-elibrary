const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    actionType: {
        type: String,
        enum: ['ASSET_MODIFIED', 'FINANCIAL_OVERRIDE', 'SECURITY_CLEARANCE', 'CATALOG_UPDATE'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        expires: '365d' // Auto-purges logs older than 1 year to save database space
    }
});

module.exports = mongoose.model('SystemLog', systemLogSchema);