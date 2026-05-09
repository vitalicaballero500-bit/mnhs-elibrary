import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ShoppingCart, BookX, X, MapPin, Hash, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client'; // <-- ELITE UPGRADE: Live Radar Receiver

const Catalog = () => {
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [genreFilter, setGenreFilter] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedBook, setSelectedBook] = useState(null);
    const [radarPulse, setRadarPulse] = useState(0); // <-- ELITE UPGRADE: Radar Refresh Trigger
    
    const { addToCart } = useCartStore();
    const { user, isAuthenticated } = useAuthStore(); 
    const navigate = useNavigate();
    const isStaff = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

    useEffect(() => { setCurrentPage(1); }, [debouncedSearch, genreFilter]);

    useEffect(() => {
        const fetchBooks = async () => {
            setIsLoading(true);
            try {
                const res = await api.get(`/books?search=${debouncedSearch}&genre=${genreFilter}&page=${currentPage}`);
                setBooks(res.data.books);
                setTotalPages(res.data.totalPages);
            } catch (error) { toast.error('Failed to load the catalog.'); } 
            finally { setIsLoading(false); }
        };
        fetchBooks();
    }, [debouncedSearch, genreFilter, currentPage, radarPulse]); // <-- THE FIX: Added radarPulse to dependencies

    // === ELITE UPGRADE: WEBSOCKET ANTENNA ===
    useEffect(() => {
        // 1. Connect to the exact port of the Backend Broadcast Tower
        const socketURL = import.meta.env.MODE === 'production' 
            ? import.meta.env.VITE_API_URL.replace('/api', '') 
            : 'http://127.0.0.1:5000';
            
        const socket = io(socketURL);

        // 2. Listen for the silent broadcast. When heard, trigger a UI update.
        socket.on('inventory_updated', () => {
            console.log("📡 Radar Ping: Global inventory shift detected. Syncing...");
            setRadarPulse(prev => prev + 1); // Forces fetchBooks to run instantly
        });

        // 3. Clean up the antenna if the user navigates away from the Catalog
        return () => socket.disconnect();
    }, []);

    const handleAddToCart = (book) => {
        if (!isAuthenticated) { toast.error('You must be signed in to reserve books.'); navigate('/login'); return; }
        addToCart(book); setSelectedBook(null); 
    };

    const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300 } } };

    return (
        <div className="max-w-7xl mx-auto mt-6 relative">
            
            {/* SEARCH & FILTER BAR */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center relative z-10 transition-colors duration-300">
                <div className="relative w-full md:w-1/2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                    <input 
                        type="text" placeholder="Search MNHS Archives..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#0A0506] border border-gray-300 dark:border-rose-950/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-800 dark:focus:ring-rose-700 outline-none transition-all"
                    />
                </div>
                
                <div className="flex items-center w-full md:w-auto gap-2">
                    <Filter className="text-gray-500 h-5 w-5" />
                    <select 
                        value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)}
                        className="w-full md:w-48 px-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer transition-colors"
                    >
                        <option value="">All Genres</option>
                        <option value="Fiction">Fiction</option><option value="Non-Fiction">Non-Fiction</option>
                        <option value="Classic">Classic</option><option value="Philosophy">Philosophy</option>
                        <option value="Romance">Romance</option><option value="Science">Science</option>
                        <option value="Technology">Technology</option><option value="History">History</option>
                        <option value="Mystery">Mystery</option><option value="Biography">Biography</option>
                        <option value="Fantasy">Fantasy</option><option value="Drama">Drama</option>
                    </select>
                </div>
            </div>

            {/* THE CATALOG GRID */}
            {isLoading ? (
                // === NEW FEATURE: ENTERPRISE SKELETON ENGINE (CATALOG) ===
                // Masks the Render.com cold start latency with perceived-performance UI
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 relative z-0">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col animate-pulse">
                            <div className="aspect-[2/3] w-full bg-gray-200 dark:bg-gray-800"></div>
                            <div className="p-4 flex flex-col flex-grow">
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
                                <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                                <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : books.length === 0 ? (
                <div className="text-center bg-white dark:bg-gray-900 p-12 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm mt-8 transition-colors duration-300">
                    <BookX className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">No books found.</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 relative z-0">
                    {books.map((book) => (
                        <motion.div 
                            key={book._id} variants={itemVariants} onClick={() => setSelectedBook(book)}
                            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer"
                        >
                            <div className="aspect-[2/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                                {/* === THE ELITE FIX: ANTI-ROT IMAGE SHIELD (GRID) === */}
                                <img 
                                    src={book.coverImageUrl} 
                                    alt={book.title} 
                                    loading="lazy"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "https://placehold.co/600x800/1e293b/3b82f6?text=Cover+Not\\nAvailable&font=Montserrat";
                                    }}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                />
                                {book.availableCopies === 0 && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                        <span className="text-white font-bold text-lg tracking-wider transform -rotate-12 border-2 border-white px-4 py-1">OUT OF STOCK</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 flex flex-col flex-grow">
                                <span className="text-xs font-black text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1">{book.genre}</span>
                                <h3 className="font-bold text-gray-900 dark:text-white leading-tight mb-1 line-clamp-2" title={book.title}>{book.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{book.author}</p>
                                <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-between transition-colors">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Stock: <strong className={book.availableCopies > 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}>{book.availableCopies}</strong>
                                    </span>
                                    <span className="text-rose-800 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400 border border-transparent group-hover:border-rose-700 px-3 py-1.5 rounded-lg text-xs font-black group-hover:bg-rose-800 group-hover:text-white transition-all shadow-sm">
                                        View Asset
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* CATALOG PAGINATION CONTROLS */}
            {!isLoading && totalPages > 1 && (
                <div className="flex justify-center items-center gap-6 mt-12 mb-8 relative z-10">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-6 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95">
                        Previous
                    </button>
                    <span className="font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg transition-colors">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-6 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95">
                        Next
                    </button>
                </div>
            )}

            {/* === THE FIX: MOBILE-NATIVE BOTTOM SHEET & MODAL HYBRID === */}
            <AnimatePresence>
                {selectedBook && (
                    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center sm:p-4">
                        {/* The Glassmorphic Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                            className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" 
                            onClick={() => setSelectedBook(null)} 
                        />
                        
                        <motion.div 
                            initial={{ opacity: 0, y: "100%" }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: "100%" }} 
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative bg-white dark:bg-gray-950 w-full max-w-4xl md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[90vh] md:max-h-[85vh] flex flex-col border border-gray-100 dark:border-gray-800"
                        >
                            {/* Mobile Drag Indicator */}
                            <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
                                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                            </div>

                            <button onClick={() => setSelectedBook(null)} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors z-10">
                                <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                            </button>

                            <div className="flex flex-col md:flex-row overflow-y-auto custom-scrollbar">
                                <div className="w-full md:w-2/5 bg-gray-50 dark:bg-gray-900 p-8 flex items-center justify-center border-r border-gray-100 dark:border-gray-800">
                                    {/* === THE ELITE FIX: ANTI-ROT IMAGE SHIELD (MODAL) === */}
                                    <img 
                                        src={selectedBook.coverImageUrl} 
                                        alt={selectedBook.title} 
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://placehold.co/600x800/1e293b/3b82f6?text=Cover+Not\\nAvailable&font=Montserrat";
                                        }}
                                        className="w-48 md:w-full max-w-[280px] rounded-xl shadow-xl object-cover aspect-[2/3]" 
                                    />
                                </div>
                                
                                <div className="w-full md:w-3/5 p-6 md:p-10 flex flex-col">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg">
                                            {selectedBook.genre}
                                        </span>
                                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> {selectedBook.publicationYear}
                                        </span>
                                    </div>
                                    
                                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight mb-2">{selectedBook.title}</h2>
                                    <p className="text-xl text-gray-500 dark:text-gray-400 font-medium mb-6">by {selectedBook.author}</p>
                                    
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8">{selectedBook.description}</p>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1 flex items-center gap-1"><Hash className="h-3 w-3" /> ISBN</p>
                                            <p className="font-mono text-sm text-gray-900 dark:text-gray-200">{selectedBook.isbn || 'N/A'}</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Location</p>
                                            <p className="font-bold text-gray-900 dark:text-gray-200">{selectedBook.shelfLocation}</p>
                                        </div>
                                    </div>

                                    <div className="mt-auto border-t border-gray-100 dark:border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="w-full sm:w-auto text-center sm:text-left">
                                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Availability</p>
                                            <p className={`text-2xl font-black ${selectedBook.availableCopies > 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                                                {selectedBook.availableCopies} <span className="text-lg font-medium text-gray-600 dark:text-gray-500">copies left</span>
                                            </p>
                                        </div>
                                        
                                        {!isStaff && (
                                            <button 
                                                onClick={() => {
                                                    handleAddToCart(selectedBook);
                                                    setSelectedBook(null); // Auto-close modal on success for smoother UX
                                                }} 
                                                disabled={selectedBook.availableCopies === 0} 
                                                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-white shadow-lg transition-all ${selectedBook.availableCopies === 0 ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 shadow-none cursor-not-allowed' : 'bg-rose-800 hover:bg-rose-900 active:scale-95 shadow-rose-900/30 border border-rose-700'}`}
                                            >
                                                {selectedBook.availableCopies === 0 ? <BookX className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
                                                {selectedBook.availableCopies === 0 ? 'Out of Stock' : 'Add to Vault'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Catalog;