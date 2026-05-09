const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

// === 1. AUTHENTICATE WITH CLOUDINARY ===
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// === 2. CONFIGURE THE STORAGE PIPELINE ===
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'lrbms_book_covers', // Creates a clean folder in your Cloudinary account
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        // Transformation: Force all covers to be optimized and standardized
        transformation: [{ width: 500, height: 750, crop: 'limit', quality: 'auto' }] 
    }
});

// === 3. EXPORT THE MULTER MIDDLEWARE ===
const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };