const cron = require('node-cron');
const nodemailer = require('nodemailer'); // <-- Added for the Email Engine
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');

const PENALTY_RATE_PER_DAY = 50; 

const startCronJobs = () => {
    
    // ====================================================================
    // ENGINE 1: THE FINANCIAL & INVENTORY SWEEP (Runs at Midnight)
    // ====================================================================
    cron.schedule('0 0 * * *', async () => {
        console.log('⏳ [CRON ENGINE] Running nightly system maintenance...');

        try {
            const now = new Date();

            // === TASK 1: APPLY PENALTIES FOR OVERDUE BOOKS ===
            const overdueTransactions = await Transaction.find({
                status: 'BORROWED',
                dueDate: { $lt: now }
            });

            let penaltyCount = 0;
            for (let tx of overdueTransactions) {
                const diffTime = Math.abs(now - new Date(tx.dueDate));
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const daysLate = diffDays > 0 ? diffDays : 1; 
                
                const calculatedPenalty = daysLate * PENALTY_RATE_PER_DAY;

                if (tx.penaltyFee !== calculatedPenalty) {
                    tx.penaltyFee = calculatedPenalty; 
                    await tx.save();
                    penaltyCount++;
                }
            }
            console.log(`✅ [CRON ENGINE] Applied penalties to ${penaltyCount} overdue accounts.`);

            // === TASK 2: SWEEP ABANDONED RESERVATIONS ===
            const expiredReservations = await Transaction.find({
                status: 'RESERVED',
                expiresAt: { $lt: now }
            });

            for (let tx of expiredReservations) {
                tx.status = 'CANCELLED';
                await tx.save();
                await Book.findByIdAndUpdate(tx.book, { $inc: { availableCopies: 1 } });
            }
            console.log(`✅ [CRON ENGINE] Cleared ${expiredReservations.length} abandoned reservations.`);

        } catch (error) {
            console.error('❌ [CRON ENGINE] Error in Midnight Sweep:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Manila" // DAGUPAN TIMEZONE ENFORCEMENT
    });


    // ====================================================================
    // ENGINE 2: THE COMMUNICATIONS RADAR (Runs at 8:00 AM)
    // ====================================================================
    cron.schedule('0 8 * * *', async () => {
        console.log('⏰ [CRON ENGINE] Running 8:00 AM Communications Radar...');
        
        try {
            const today = new Date();
            
            // Find overdue books and populate user data to get their emails
            const activeLoans = await Transaction.find({ 
                status: 'BORROWED',
                dueDate: { $lte: today } 
            }).populate('user').populate('book');

            if (activeLoans.length === 0) {
                return console.log('✅ [CRON ENGINE] Radar Clear: No warning emails needed today.');
            }

            // Configure the Google Postman
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            let emailCount = 0;
            // Fire off the warning emails
            for (let loan of activeLoans) {
                if (!loan.user || !loan.user.email) continue;

                const mailOptions = {
                    from: `"E-Lend Library Command" <${process.env.EMAIL_USER}>`,
                    to: loan.user.email,
                    subject: `🚨 OVERDUE NOTICE: ${loan.book?.title}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <div style="background-color: #ef4444; padding: 25px; text-align: center;">
                                <h2 style="color: white; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px;">CRITICAL ACCOUNT ALERT</h2>
                            </div>
                            <div style="padding: 30px; background-color: #ffffff;">
                                <p style="font-size: 16px; color: #374151;">Attention <strong>${loan.user.firstName}</strong>,</p>
                                <p style="font-size: 16px; color: #374151;">This is an automated alert from the E-Lend Command Center. The following physical asset is now officially overdue:</p>
                                
                                <div style="background-color: #f9fafb; border-left: 4px solid #ef4444; padding: 20px; border-radius: 0 8px 8px 0; margin: 25px 0;">
                                    <p style="margin: 0; font-size: 20px; font-weight: 900; color: #111827;">📖 ${loan.book?.title}</p>
                                    <p style="margin: 8px 0 0 0; font-size: 14px; font-weight: bold; color: #ef4444;">DUE DATE: ${new Date(loan.dueDate).toLocaleDateString()}</p>
                                </div>
                                
                                <p style="font-size: 16px; color: #b91c1c; font-weight: 900; text-transform: uppercase;">Daily penalty fines are currently accruing.</p>
                                <p style="font-size: 16px; color: #4b5563; line-height: 1.5;">Your catalog borrowing privileges have been temporarily suspended. Please return this asset to the front desk immediately and settle your accrued balance of ₱${loan.penaltyFee} to restore access.</p>
                            </div>
                        </div>
                    `
                };

                await transporter.sendMail(mailOptions);
                emailCount++;
            }
            
            console.log(`📧 [CRON ENGINE] Dispatched ${emailCount} warning emails.`);

        } catch (error) {
            console.error('❌ [CRON ENGINE] Error in Communications Radar:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Manila" // DAGUPAN TIMEZONE ENFORCEMENT
    });

};

module.exports = startCronJobs;