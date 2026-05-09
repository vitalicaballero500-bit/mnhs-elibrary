const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User'); // Adjust path if your models folder is elsewhere

// Force Node to look for the .env file exactly one folder up
dotenv.config({ path: path.join(__dirname, '../.env') }); 

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to the Vault.');

        const adminEmail = 'admin@dagupan.edu';
        
        // Cryptographically hash the master password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('AdminSecure123!', salt);

        // === THE ELITE FIX: FORCEFUL UPSERT ===
        // This will find the admin and FORCE the password to update. 
        // If the admin somehow doesn't exist, it creates it.
        await User.findOneAndUpdate(
            { email: adminEmail },
            {
                firstName: 'Master',
                lastName: 'Admin',
                password: hashedPassword,
                role: 'ADMIN',
                classification: 'ADULT',
                isActive: true
            },
            { upsert: true, new: true } 
        );

        console.log('🚨 SECURITY OVERRIDE SUCCESSFUL!');
        console.log('✅ Master Admin password FORCEFULLY overwritten to: AdminSecure123!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeder Error:', error);
        process.exit(1);
    }
};

seedAdmin();