const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: { type: String, required: [true, 'Book title is required'], trim: true, index: true },
    author: { type: String, required: [true, 'Author name is required'], trim: true },
    // === 🚨 PHASE 2 UPGRADE: ISBN LIMITS ===
    isbn: { type: String, unique: true, sparse: true, minlength: 10, maxlength: 13 },
    shelfLocation: { type: String, required: [true, 'Physical shelf location is required'], trim: true },
    publicationYear: { type: Number, required: [true, 'Publication year is required'] },
    genre: { type: String, required: [true, 'Genre is required'], index: true },
    description: { type: String },
    coverImageUrl: { type: String, default: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/default_book_cover' },
    totalCopies: { type: Number, required: true, min: [0, 'Total copies cannot be negative'] },
    availableCopies: { type: Number, required: true, min: [0, 'Available copies cannot be negative'] },
    isActive: { type: Boolean, default: true },
    // === 🚨 PHASE 2 UPGRADE: ASSET PRICING ===
    price: { type: Number, default: 500 }
}, { timestamps: true });

bookSchema.index({ title: 'text', author: 'text' });

module.exports = mongoose.model('Book', bookSchema);