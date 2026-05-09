const Book = require('../models/Book');
const { logSystemAction } = require('./systemController');
// 1. ADD A NEW BOOK (Librarian/Admin Only)
exports.addBook = async (req, res) => {
    try {
        const bookData = { ...req.body };

        // === THE FIX: CLOUDINARY URL INJECTION ===
        // If the multer middleware successfully uploaded the image, it attaches the URL here
        if (req.file && req.file.path) {
            bookData.coverImageUrl = req.file.path;
        }

        const book = await Book.create(bookData);
        // 🚨 CAMERA TRIPWIRE
        await logSystemAction(req.user._id, 'CATALOG_UPDATE', `Registered new physical asset: ${book.title}`);
        res.status(201).json({ message: 'Book cataloged successfully.', book });
    } catch (error) {
        res.status(400).json({ message: 'Failed to catalog book.', error: error.message });
    }
};

// 2. GET ALL BOOKS (With High-Performance Search, Sort, & Pagination)
exports.getBooks = async (req, res) => {
    try {
        // Extract query parameters from the URL
        const { search, genre, sort, page = 1, limit = 10 } = req.query;

        // Base Query: Only fetch books that are NOT soft-deleted
        let query = { isActive: true };

        // === THE FIX: BULLETPROOF REGEX SEARCH ===
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } }
            ];
        }

        if (genre) {
            query.genre = genre;
        }

        // === THE FIX: PAGINATION MATH ===
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        const books = await Book.find(query)
            .skip(skip)
            .limit(limitNumber);

        // Calculate total documents for the frontend pagination controls
        const totalBooks = await Book.countDocuments(query);
        const totalPages = Math.ceil(totalBooks / limitNumber);

        res.status(200).json({ 
            books, 
            currentPage: pageNumber, 
            totalPages, 
            totalBooks 
        });
    } catch (error) {
        res.status(400).json({ message: 'Failed to retrieve books.', error: error.message });
    }
};

// 3. UPDATE BOOK DETAILS
exports.updateBook = async (req, res) => {
    try {
        const updateData = { ...req.body };

        if (req.file && req.file.path) {
            updateData.coverImageUrl = req.file.path;
        }

        const updatedBook = await Book.findByIdAndUpdate(req.params.id, updateData, { 
            new: true, // Returns the updated document
            runValidators: true // Enforces schema rules (no negative stock)
        });

        if (!updatedBook) return res.status(404).json({ message: 'Book not found.' });

        // 🚨 CAMERA TRIPWIRE
        await logSystemAction(req.user._id, 'ASSET_MODIFIED', `Updated asset data for: ${updatedBook.title}`);

        res.status(200).json({ message: 'Book updated.', book: updatedBook });
    } catch (error) {
        res.status(400).json({ message: 'Update failed.', error: error.message });
    }
};

// 4. SOFT DELETE A BOOK (Librarian/Admin Only)
exports.toggleBookStatus = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found.' });

        // === THE FIX: SOFT DELETE ===
        // Instead of deleting, we hide it. This preserves borrowing history.
        book.isActive = !book.isActive; 
        await book.save();

        // 🚨 CAMERA TRIPWIRE
        await logSystemAction(req.user._id, 'CATALOG_UPDATE', `Asset ${book.title} status shifted to: ${book.isActive ? 'Active' : 'Archived'}`);

        res.status(200).json({ message: `Book status changed to ${book.isActive ? 'Active' : 'Archived'}.` });
    } catch (error) {
        res.status(500).json({ message: 'Status change failed.', error: error.message });
    }
};