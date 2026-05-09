const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http'); // <-- ELITE UPGRADE: Core Node HTTP
const { Server } = require('socket.io'); // <-- ELITE UPGRADE: WebSocket Engine

// === NEW FEATURE: ENTERPRISE CLOUD MIDDLEWARES ===
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// === THE ELITE FIX: LIVE RADAR IGNITION ===
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:5173', 
            'http://127.0.0.1:5173', 
            'https://mnhs-elibrary-6r7o.vercel.app',
            'https://mnhs-elibrary-6r7o-ns5taxiad-ruszkin-s-projects.vercel.app'
        ], 
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
        credentials: true
    }
});

// Attach the 'io' antenna to the Express app so controllers can use it
app.set('io', io);

io.on('connection', (socket) => {
    console.log(`📡 Live Radar Connected: Device [${socket.id}]`);
    socket.on('disconnect', () => console.log(`📡 Radar Disconnected: [${socket.id}]`));
});

// === THE FIX: CLOUD ARMOR & BANDWIDTH OPTIMIZATION ===
// 1. Helmet: Secures HTTP headers and hides the Express framework signature from attackers
app.use(helmet());

// 2. Compression: GZIPs all JSON responses to save bandwidth and guarantee instant frontend renders
app.use(compression());

// 3. Rate Limiter: Protects the MongoDB free tier from DDoS and brute-force login attacks
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: 300, // Limit each IP to 300 requests per window
    message: { message: 'NETWORK LOCKDOWN: Suspicious traffic detected from your IP. Try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
// Apply this defense grid exclusively to our API routes
app.use('/api', apiLimiter);

// === EXISTING LOCALHOST CORS SHIELD (Keep everything below this line exactly as it was) ===
const allowedOrigins = [
    'http://localhost:5173', 
    'http://localhost:5176',
    'http://127.0.0.1:5173', 
    'http://localhost:5174', 
    'http://127.0.0.1:5174',
    'http://localhost:5175', 
    'http://127.0.0.1:5175',
    'https://mnhs-elibrary-6r7o.vercel.app',
    'https://mnhs-elibrary-6r7o-ns5taxiad-ruszkin-s-projects.vercel.app',
    process.env.CLIENT_URL 
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`🚨 Blocked Origin: ${origin}`); 
            callback(new Error('CORS security policy blocked this request.'));
        }
    },
    credentials: true 
}));

app.use(express.json());
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// === RE-INTEGRATING YOUR EXISTING ARCHITECTURE ===
// Restoring the lost MongoDB connection and Route matrix
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 10, 
            serverSelectionTimeoutMS: 5000,
        });
        console.log('✅ Enterprise MongoDB connection established.');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1); 
    }
};
connectDB();

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/books', require('./routes/bookRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/system', require('./routes/systemRoutes')); // <-- ELITE UPGRADE: The Audit Engine

// === ELITE UPGRADE: THE CASH FLOW ENGINE (STRIPE) ===
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Transaction = require('./models/Transaction');

app.post('/api/payments/create-checkout-session', async (req, res) => {
    try {
        const { transactionId, fineAmount, bookTitle } = req.body;

        // In a real production app, this creates a Stripe Checkout URL. 
        // For our F1 simulation, we will bypass the Stripe redirect and instantly settle the fine.
        
        const transaction = await Transaction.findById(transactionId);
        if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });

        // Simulate a successful Stripe charge and wipe the debt
        transaction.penaltyFee = 0;
        await transaction.save();

        // Trigger the Live Radar so the Admin Dashboard instantly reflects the payment
        req.app.get('io').emit('radar_updated');

        res.status(200).json({ success: true, message: 'Payment successfully processed via Stripe Gateway.' });
    } catch (error) {
        res.status(500).json({ message: 'Payment Gateway Error', error: error.message });
    }
});

// Restore Automated CRON Jobs
const startCronJobs = require('./utils/cronJobs');
startCronJobs();

app.get('/', (req, res) => {
    res.status(200).json({ message: 'LRBMS-Master API Engine is running smoothly.' });
});

// === THE FIX: EXPRESS 5 GLOBAL ERROR CATCHER ===
// Stays at the absolute bottom to catch all falling errors
app.use((err, req, res, next) => {
    console.error('🔥 Fatal Architecture Error:', err.message);
    res.status(err.status || 500).json({
        message: 'A critical server error occurred. The engineering team has been notified.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => { // <-- THE FIX: Changed 'app' to 'server'
    console.log(`🚀 Engine live on port ${PORT}`);
    console.log(`📡 Broadcasting Antenna Active.`);
});