// === HIGH-END SPATIAL MEMBER DASHBOARD ===
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Clock, Settings, Ticket, User, MapPin, Phone, ShieldCheck, CheckCircle, AlertTriangle, AlertOctagon, DollarSign, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import useThemeStore from '../store/useThemeStore';

// === PHYSICS PRESETS ===
const springAnim = { type: "spring", damping: 25, stiffness: 300 };
const tabVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: springAnim }, exit: { opacity: 0, y: -15, transition: { duration: 0.15 } } };

const MemberDashboard = () => {
    const { user } = useAuthStore(); 
    const { isDarkMode, toggleTheme } = useThemeStore();
    const [activeTab, setActiveTab] = useState('vault');
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [profileForm, setProfileForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', suffix: user?.suffix || '', age: user?.age || '', gender: user?.gender || 'Prefer not to say', address: user?.address || '', contactNumber: user?.contactNumber || '' });

    useEffect(() => {
        const fetchVaultData = async () => {
            try { const res = await api.get('/transactions/my-vault'); setTransactions(res.data); } 
            catch (error) { toast.error('Failed to load vault data.'); } finally { setIsLoading(false); }
        }; fetchVaultData();
    }, []);

    const handleProfileUpdate = async (e) => {
        e.preventDefault(); const toastId = toast.loading('Securing identity updates...');
        try { const res = await api.put('/users/profile', profileForm); useAuthStore.setState({ user: { ...user, ...res.data.user } }); toast.success('Identity credentials updated.', { id: toastId }); } 
        catch (error) { toast.error(error.response?.data?.message || 'Update failed.', { id: toastId }); }
    };

    // === ELITE UPGRADE: INITIATE STRIPE CHECKOUT ===
    const handleDigitalPayment = async (transactionId, amount, title) => {
        const toastId = toast.loading('Connecting to secure payment gateway...');
        try {
            const res = await api.post('/payments/create-checkout-session', { transactionId, fineAmount: amount, bookTitle: title });
            toast.success(res.data.message, { id: toastId });
            
            // Re-fetch vault data to visually clear the red fine from the screen
            const vaultRes = await api.get('/transactions/my-vault'); 
            setTransactions(vaultRes.data);
        } catch (error) {
            toast.error('Payment processing failed. Try again later.', { id: toastId });
        }
    };

    const reservedBooks = transactions.filter(tx => tx.status === 'RESERVED');
    const borrowedBooks = transactions.filter(tx => tx.status === 'BORROWED');
    const totalFines = borrowedBooks.reduce((sum, tx) => sum + (tx.penaltyFee || 0), 0);
    const hasOverdue = borrowedBooks.some(tx => new Date(tx.dueDate) < new Date());

    const getUrgencyBadge = (dueDate) => {
        const diffDays = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) return { text: `Due in ${diffDays} Days`, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' };
        if (diffDays === 1) return { text: 'Due Tomorrow', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' };
        if (diffDays === 0) return { text: 'DUE TODAY', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800 font-black' };
        return { text: `LATE BY ${Math.abs(diffDays)} DAYS`, color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 font-black tracking-widest shadow-sm' };
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl text-white shadow-lg hidden sm:block"><User className="h-10 w-10" /></div>
                    <div><h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">Member Command Center</h1><p className="text-base text-gray-500 dark:text-gray-400 font-bold mt-1">Manage your vault, track assets, and deadlines.</p></div>
                </div>
                <button onClick={toggleTheme} className="p-4 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95" title="Toggle Theme">{isDarkMode ? <Sun className="h-6 w-6 text-amber-500" /> : <Moon className="h-6 w-6 text-blue-600" />}</button>
            </div>

            <AnimatePresence>
                {(hasOverdue || totalFines > 0) && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl flex items-start sm:items-center gap-5 shadow-sm overflow-hidden">
                        <AlertOctagon className="h-12 w-12 text-red-600 dark:text-red-500 flex-shrink-0" />
                        <div><h3 className="text-red-800 dark:text-red-400 font-black text-xl tracking-wide uppercase">Account Suspended</h3><p className="text-red-700 dark:text-red-300 font-medium mt-1">You have an overdue asset or unpaid fines. Catalog privileges revoked. Visit the front desk.</p></div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex items-center justify-between transition-colors">
                    <div><p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Pending Vault</p><p className="text-5xl font-black text-gray-900 dark:text-white">{reservedBooks.length}</p></div><Ticket className="h-16 w-16 text-blue-100 dark:text-blue-900/30" />
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex items-center justify-between transition-colors">
                    <div><p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Active Assets</p><p className="text-5xl font-black text-gray-900 dark:text-white">{borrowedBooks.length}</p></div><Book className="h-16 w-16 text-green-100 dark:text-green-900/30" />
                </motion.div>
                <motion.div whileHover={{ y: -5 }} className={`rounded-3xl p-6 shadow-sm flex items-center justify-between transition-colors ${totalFines > 0 ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800' : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800'}`}>
                    <div><p className={`text-xs font-black uppercase tracking-widest mb-2 ${totalFines > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400'}`}>Accrued Fines</p><p className={`text-5xl font-black ${totalFines > 0 ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>₱{totalFines}</p></div><DollarSign className={`h-16 w-16 ${totalFines > 0 ? 'text-red-200 dark:text-red-900/50' : 'text-gray-100 dark:text-gray-800'}`} />
                </motion.div>
            </div>

            <div className="flex flex-wrap gap-3 mb-10 bg-white dark:bg-gray-900 p-3 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
                {[{ id: 'vault', icon: Ticket, label: 'My Vault' }, { id: 'active', icon: Book, label: 'Active Assets' }, { id: 'settings', icon: Settings, label: 'Identity Settings' }].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-[1.5rem] font-bold transition-all text-lg ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                        <tab.icon className="h-5 w-5" /> {tab.label}
                    </button>
                ))}
            </div>

            {isLoading ? (<div className="text-center py-20 text-blue-600 dark:text-blue-400 font-black tracking-widest animate-pulse text-xl">DECRYPTING VAULT DATA...</div>) : (
                <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 p-8 sm:p-12 transition-colors relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        
                        {activeTab === 'vault' && (
                            <motion.div key="vault" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3"><Ticket className="h-8 w-8 text-blue-600"/> Pending Reservations</h2>
                                {reservedBooks.length === 0 ? (<p className="text-gray-500 text-center py-16 bg-gray-50 dark:bg-gray-950 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 font-bold text-lg">No active reservations in your vault.</p>) : (
                                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <AnimatePresence>
                                            {reservedBooks.map(tx => (
                                                <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={springAnim} key={tx._id} className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-3xl p-8 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all">
                                                    <div><h3 className="font-bold text-gray-900 dark:text-white text-xl mb-2 leading-tight">{tx.book?.title}</h3><p className="text-sm text-gray-600 dark:text-gray-400 mb-6 font-medium">Master Code: <span className="font-mono font-black text-2xl tracking-[0.1em] text-blue-700 dark:text-blue-400 bg-white dark:bg-gray-900 px-4 py-2 rounded-xl border border-blue-200 dark:border-blue-800 ml-2 shadow-inner">{tx.reservationCode}</span></p></div>
                                                    <div className="flex items-center gap-2 text-sm font-black text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 w-fit px-4 py-2 rounded-xl border border-orange-200 dark:border-orange-800/50"><Clock className="h-4 w-4" /> EXPIRES IN 24H</div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'active' && (
                            <motion.div key="active" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3"><Book className="h-8 w-8 text-green-600"/> Currently Borrowed</h2>
                                {borrowedBooks.length === 0 ? (<p className="text-gray-500 text-center py-16 bg-gray-50 dark:bg-gray-950 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 font-bold text-lg">You have no active physical assets.</p>) : (
                                    <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <AnimatePresence>
                                            {borrowedBooks.map(tx => {
                                                const urgency = getUrgencyBadge(tx.dueDate);
                                                return (
                                                    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={springAnim} key={tx._id} className={`bg-white dark:bg-gray-800 border-2 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start gap-6 hover:shadow-lg transition-all ${tx.penaltyFee > 0 ? 'border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10' : 'border-gray-100 dark:border-gray-700'}`}>
                                                        <img src={tx.book?.coverImageUrl} alt="Cover" className="w-24 h-36 object-cover rounded-2xl shadow-md border border-gray-200 dark:border-gray-600" />
                                                        <div className="flex-1 w-full flex flex-col h-full"><h3 className="font-bold text-gray-900 dark:text-white text-xl leading-tight mb-3">{tx.book?.title}</h3><div className={`text-xs px-3 py-1.5 border rounded-lg w-fit mb-4 transition-colors font-bold ${urgency.color}`}>{urgency.text}</div><div className="flex items-center justify-between w-full border-t border-gray-100 dark:border-gray-700 pt-4 mt-auto">
    <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">Borrowed: {new Date(tx.borrowedAt).toLocaleDateString()}</p>
    {tx.penaltyFee > 0 && (
        <div className="flex items-center gap-2">
            <p className="text-sm font-black text-red-600 dark:text-red-400 flex items-center gap-1.5 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800"><AlertTriangle className="h-4 w-4"/> ₱{tx.penaltyFee}</p>
            {/* ELITE UPGRADE: PAY NOW BUTTON */}
            <button onClick={() => handleDigitalPayment(tx._id, tx.penaltyFee, tx.book?.title)} className="bg-red-600 hover:bg-red-700 text-white text-xs font-black px-4 py-1.5 rounded-lg shadow-md active:scale-95 transition-all flex items-center gap-1">Pay Fine</button>
        </div>
    )}
</div></div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'settings' && (
                            <motion.div key="settings" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
                                <form onSubmit={handleProfileUpdate} className="max-w-3xl">
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-900/50 rounded-2xl p-6 mb-10 flex items-start gap-4"><ShieldCheck className="h-8 w-8 text-yellow-600 dark:text-yellow-500 flex-shrink-0" /><p className="text-sm text-yellow-800 dark:text-yellow-200 font-bold leading-relaxed">Your digital credentials must strictly match your physical Municipal Library ID. Discrepancies during front-desk verification will result in immediate reservation denial.</p></div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
                                        <div><label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">First Name</label><input type="text" value={profileForm.firstName} onChange={e => setProfileForm({...profileForm, firstName: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg font-medium" required/></div>
                                        <div><label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Last Name</label><input type="text" value={profileForm.lastName} onChange={e => setProfileForm({...profileForm, lastName: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg font-medium" required/></div>
                                        
                                        {/* === THE RESTORED FIELDS === */}
                                        <div className="grid grid-cols-3 gap-4 sm:col-span-2">
                                            <div className="col-span-1"><label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Suffix</label><input type="text" value={profileForm.suffix} onChange={e => setProfileForm({...profileForm, suffix: e.target.value})} placeholder="e.g. Jr" className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg font-medium" /></div>
                                            <div className="col-span-1"><label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Age</label><input type="number" min="5" value={profileForm.age} onChange={e => setProfileForm({...profileForm, age: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg font-medium" required/></div>
                                            <div className="col-span-1"><label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Gender</label><select value={profileForm.gender} onChange={e => setProfileForm({...profileForm, gender: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-lg font-medium"><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
                                        </div>

                                        <div className="sm:col-span-2"><label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Physical Address</label><input type="text" value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg font-medium" required/></div>
                                        <div className="sm:col-span-2"><label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Contact Number</label><input type="text" value={profileForm.contactNumber} onChange={e => setProfileForm({...profileForm, contactNumber: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl px-5 py-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg font-medium" required/></div>
                                    </div>
                                    <button type="submit" className="flex items-center justify-center gap-3 bg-gray-900 dark:bg-blue-600 text-white w-full sm:w-auto px-10 py-5 rounded-2xl font-black text-lg hover:bg-gray-800 dark:hover:bg-blue-700 transition-all shadow-xl active:scale-95"><CheckCircle className="h-6 w-6" /> SAVE IDENTITY CREDENTIALS</button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default MemberDashboard;