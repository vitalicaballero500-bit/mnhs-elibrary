// === HIGH-END SPATIAL CART & CHECKOUT ===
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, Ticket, CheckCircle, ArrowRight, AlertOctagon, CalendarDays, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import useCartStore from '../store/useCartStore';

// === PHYSICS PRESETS ===
const springAnim = { type: "spring", damping: 25, stiffness: 300 };
const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const modalVariants = { hidden: { opacity: 0, scale: 0.95, y: 20 }, visible: { opacity: 1, scale: 1, y: 0, transition: springAnim }, exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } } };

const Cart = () => {
    const { cart, removeFromCart } = useCartStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [reservationTickets, setReservationTickets] = useState([]);
    const [borrowDays, setBorrowDays] = useState(7); 
    const [isSuspended, setIsSuspended] = useState(false);
    const [suspensionMessage, setSuspensionMessage] = useState('');
    const [selectedItems, setSelectedItems] = useState(cart.map(b => b._id));

    useEffect(() => { setSelectedItems(prev => prev.filter(id => cart.some(book => book._id === id))); }, [cart]);
    const toggleSelection = (bookId) => { setSelectedItems(prev => prev.includes(bookId) ? prev.filter(id => id !== bookId) : [...prev, bookId]); };

    const handleCheckout = async () => {
        if (selectedItems.length === 0) return toast.error('Please select at least one asset to reserve.');
        setIsProcessing(true); setIsSuspended(false); const loadingToast = toast.loading('Securing your selected assets in the Vault...');
        try {
            const res = await api.post('/transactions/reserve-bulk', { items: selectedItems, requestedDays: borrowDays });
            setReservationTickets(res.data.tickets); selectedItems.forEach(id => removeFromCart(id)); setSelectedItems([]); toast.success('Checkout complete! Assets secured.', { id: loadingToast });
        } catch (error) {
            if (error.response?.data?.isSuspended) { setIsSuspended(true); setSuspensionMessage(error.response.data.message); toast.dismiss(loadingToast); } 
            else { toast.error(error.response?.data?.message || 'A critical network error occurred.', { id: loadingToast, duration: 5000 }); }
        } finally { setIsProcessing(false); }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 relative">
            <div className="flex items-center gap-3 mb-8"><div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400"><ShoppingBag className="h-6 w-6" /></div><h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Your Asset Cart</h1></div>
            
            <AnimatePresence>
                {isSuspended && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800/50 rounded-2xl flex items-start gap-4 overflow-hidden">
                        <AlertOctagon className="h-8 w-8 text-red-600 dark:text-red-500 flex-shrink-0" />
                        <div><h3 className="text-red-800 dark:text-red-400 font-bold text-lg mb-1">Account Locked</h3><p className="text-red-700 dark:text-red-300">{suspensionMessage}</p></div>
                    </motion.div>
                )}
            </AnimatePresence>

            {cart.length === 0 && reservationTickets.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springAnim} className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-16 text-center shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
                    <img src="https://illustrations.popsy.co/gray/falling.svg" alt="Empty Cart" className="w-48 h-48 mx-auto mb-6 opacity-60 dark:invert" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Your cart is empty</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">Explore the catalog to find your next read.</p>
                    <Link to="/" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:shadow-blue-600/30 active:scale-95 transition-all">Browse Catalog <ArrowRight className="h-5 w-5" /></Link>
                </motion.div>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
                    <div className="p-6 sm:p-10 space-y-4">
                        <AnimatePresence>
                            {cart.map((book) => (
                                <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, x: -20 }} transition={springAnim} key={book._id} className={`flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 rounded-3xl transition-all duration-300 ${selectedItems.includes(book._id) ? 'bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-gray-50/50 dark:bg-gray-800/50 border border-transparent'}`}>
                                    <div className="pl-2"><input type="checkbox" checked={selectedItems.includes(book._id)} onChange={() => toggleSelection(book._id)} className="w-6 h-6 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 cursor-pointer" /></div>
                                    <img src={book.coverImageUrl} alt={book.title} className="w-20 h-28 object-cover rounded-xl shadow-md border border-gray-200 dark:border-gray-700 hover:scale-105 transition-transform" />
                                    <div className="flex-1"><h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{book.title}</h3><p className="text-gray-500 dark:text-gray-400 font-medium">{book.author}</p></div>
                                    <button onClick={() => removeFromCart(book._id)} className="p-4 text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-2xl transition-all w-full sm:w-auto flex justify-center active:scale-95"><Trash2 className="h-5 w-5" /></button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {cart.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-950 p-6 sm:p-10 border-t border-gray-100 dark:border-gray-800 flex flex-col lg:flex-row items-center justify-between gap-6 transition-colors">
                            <div className="flex items-center gap-5 bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm w-full lg:w-auto"><div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 hidden sm:block"><CalendarDays className="h-6 w-6" /></div><div className="flex-1"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Borrow Duration</label><select value={borrowDays} onChange={(e) => setBorrowDays(Number(e.target.value))} className="w-full bg-transparent text-gray-900 dark:text-white font-black text-lg focus:outline-none cursor-pointer" disabled={isProcessing || isSuspended}>{[...Array(14)].map((_, i) => (<option key={i + 1} value={i + 1} className="text-gray-900">{i + 1} {i === 0 ? 'Day' : 'Days'}</option>))}</select></div></div>
                            <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto"><div className="text-center sm:text-right"><p className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-1">Selected Assets</p><p className="text-4xl font-black text-gray-900 dark:text-white">{selectedItems.length}</p></div><button onClick={handleCheckout} disabled={isProcessing || isSuspended || selectedItems.length === 0} className={`w-full sm:w-auto px-12 py-5 rounded-2xl text-white font-black text-xl shadow-xl transition-all ${isProcessing || isSuspended || selectedItems.length === 0 ? 'bg-gray-400 dark:bg-gray-800 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95 hover:shadow-blue-600/30'}`}>{isProcessing ? 'Processing...' : isSuspended ? 'Vault Locked' : 'Secure Assets'}</button></div>
                        </div>
                    )}
                </div>
            )}

            {/* === GLOBAL CHECKOUT SUCCESS MODAL === */}
            <AnimatePresence>
                {reservationTickets.length > 0 && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 bg-gray-900/80 backdrop-blur-md" />
                        <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden w-full max-w-3xl relative z-10 p-10 max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-800 text-center">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ type: "spring", damping: 15, stiffness: 200 }} className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" /></motion.div>
                            <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Vault Access Granted</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg font-medium">Present these secure codes to the Librarian at the front desk to claim your assets.</p>
                            <div className="space-y-4 mb-10 text-left">
                                {reservationTickets.map((ticket, index) => (
                                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} key={index} className="bg-gray-50 dark:bg-gray-950 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between border border-gray-200 dark:border-gray-800 shadow-sm">
                                        <div><p className="font-bold text-gray-900 dark:text-white text-xl mb-1">{ticket.title}</p><p className="text-sm font-bold text-orange-500 flex items-center gap-2"><Ticket className="h-4 w-4" /> Valid for 24 Hours</p></div>
                                        <div className="mt-4 sm:mt-0 bg-white dark:bg-gray-900 px-8 py-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 shadow-inner"><p className="text-4xl font-mono font-black tracking-[0.2em] text-blue-600 dark:text-blue-400">{ticket.code}</p></div>
                                    </motion.div>
                                ))}
                            </div>
                            <button onClick={() => { setReservationTickets([]); navigate('/member-dashboard'); }} className="inline-flex items-center justify-center gap-3 w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xl rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-xl active:scale-95">Go to Command Center <ArrowRight className="h-6 w-6" /></button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Cart;