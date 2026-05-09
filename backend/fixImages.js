const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Book = require('./models/Book');

dotenv.config({ path: path.join(__dirname, '.env') });

const fixBrokenImages = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to the Vault.');

        // Update Fahrenheit 451 (New Fire Aesthetic)
        await Book.findOneAndUpdate(
            { title: "Fahrenheit 451" },
            { coverImageUrl: "https://images.unsplash.com/photo-1485286162995-aa63d31c06cb?q=80&w=600&auto=format&fit=crop" }
        );

        // Update Catcher in the Rye (New Moody Aesthetic)
        await Book.findOneAndUpdate(
            { title: "The Catcher in the Rye" },
            { coverImageUrl: "https://images.unsplash.com/photo-1474366521946-c3d4b507abf2?q=80&w=600&auto=format&fit=crop" }
        );

        // === THE ELITE FIX: UNRESTRICTED WIKIMEDIA LINKS ===

        // Update A Tale of Two Cities (Official First Edition Cover)
        await Book.findOneAndUpdate(
            { title: "A Tale of Two Cities" },
            { coverImageUrl: "https://upload.wikimedia.org/wikipedia/commons/8/89/A_Tale_of_Two_Cities_title_page.jpg" }
        );

        // Update Brave New World (Official First Edition Cover)
        await Book.findOneAndUpdate(
            { title: "Brave New World" },
            { coverImageUrl: "https://upload.wikimedia.org/wikipedia/en/6/62/BraveNewWorld_FirstEdition.jpg" }
        );

        console.log('🖼️ Successfully patched broken images in the database!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error patching images:', error);
        process.exit(1);
    }
};

fixBrokenImages();