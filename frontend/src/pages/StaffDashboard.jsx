import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, BookPlus, ScanBarcode, CheckCircle, User, Calendar, Book, ArrowLeftRight, AlertCircle, MapPin, Phone, ShieldCheck, XCircle, Skull, Users, DollarSign, History, Clock, LayoutGrid, Library, UserCheck, BookOpen, Sun, Moon, UserPlus, Search, Edit, Archive, RefreshCw, Plus, ChevronDown, X, Mail, GraduationCap, Shield } from 'lucide-react';
import useThemeStore from '../store/useThemeStore';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
import toast from 'react-hot-toast';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import Catalog from './Catalog'; 
import { io } from 'socket.io-client'; // <-- ELITE UPGRADE: Live Radar Receiver

// === HIGH-END ANIMATION PRESETS ===
const springAnim = { type: "spring", damping: 25, stiffness: 300 };
const modalVariants = { hidden: { opacity: 0, scale: 0.95, y: 20 }, visible: { opacity: 1, scale: 1, y: 0, transition: springAnim }, exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } } };
const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const tabVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: springAnim }, exit: { opacity: 0, y: -15, transition: { duration: 0.15 } } };

const StaffDashboard = () => {
    const { user } = useAuthStore();
    const { isDarkMode, toggleTheme } = useThemeStore();
    const [activeTab, setActiveTab] = useState(user?.role === 'ADMIN' ? 'overview' : 'verification'); 

    const [isCataloging, setIsCataloging] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [coverImage, setCoverImage] = useState(null);
    const [bookForm, setBookForm] = useState({ title: '', author: '', genre: '', description: '', totalCopies: 1, isbn: '', shelfLocation: '', publicationYear: '', price: 500 });
    // === 🚨 SMART GENRE MANAGER STATE ===
    const defaultGenres = ['Fiction', 'Non-Fiction', 'Classic', 'Philosophy', 'Romance', 'Science', 'Technology', 'History', 'Mystery', 'Biography', 'Fantasy', 'Drama'];
    const [availableGenres, setAvailableGenres] = useState(defaultGenres);
    const [newGenreInput, setNewGenreInput] = useState('');
    const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
    const [returnTarget, setReturnTarget] = useState(null);
    const [returnCondition, setReturnCondition] = useState('Good');
    
    const [inventory, setInventory] = useState([]);
    const [inventoryPage, setInventoryPage] = useState(1);
    const [inventoryTotalPages, setInventoryTotalPages] = useState(1);
    const [editingBookId, setEditingBookId] = useState(null);

    // === ELITE POLISH: LIVE INVENTORY SEARCH ===
    const [inventorySearch, setInventorySearch] = useState('');
    const [debouncedInvSearch, setDebouncedInvSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedInvSearch(inventorySearch), 500);
        return () => clearTimeout(timer);
    }, [inventorySearch]);

    const [isScanning, setIsScanning] = useState(false);
    const [reservationCode, setReservationCode] = useState('');
    const [pendingVerification, setPendingVerification] = useState(null); 
    const [scanResult, setScanResult] = useState(null);

    const [activeBorrowings, setActiveBorrowings] = useState([]);
    const [isLoadingReturns, setIsLoadingReturns] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isBlacklisting, setIsBlacklisting] = useState(false);

    const [transactionHistory, setTransactionHistory] = useState([]);
    const [isLoadingLedger, setIsLoadingLedger] = useState(false);
    const [ledgerPage, setLedgerPage] = useState(1);
    const [ledgerTotalPages, setLedgerTotalPages] = useState(1);

    // === ELITE UPGRADE: GOD VIEW STATE ===
    const [auditLogs, setAuditLogs] = useState([]);
    const [isLoadingAudit, setIsLoadingAudit] = useState(false);

    const [telemetry, setTelemetry] = useState(null);
    const [showStaffModal, setShowStaffModal] = useState(false); // NEW MODAL STATE
    const [isCreatingStaff, setIsCreatingStaff] = useState(false);
    const [staffForm, setStaffForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'LIBRARIAN' });
    const [staffList, setStaffList] = useState([]);
    
    // === ELITE UPGRADE: CUSTOM CONFIRMATION MODAL STATE ===
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', type: 'danger', onConfirm: null });

    // === ELITE UPGRADE: RADAR TRIGGER STATE ===
    const [radarPulse, setRadarPulse] = useState(0);

    // === ELITE UPGRADE: GOD VIEW FETCHER ===
    const fetchAuditLogs = async () => {
        setIsLoadingAudit(true);
        try {
            const res = await api.get('/system/audit-logs');
            setAuditLogs(res.data);
        } catch (error) { toast.error("Failed to load security logs."); } 
        finally { setIsLoadingAudit(false); }
    };

    // === THE FIX: PROPER LIFECYCLE SEPARATION ===
    useEffect(() => {
        if (activeTab === 'loans') fetchActiveBorrowings();
        if (activeTab === 'ledger') fetchLedger(ledgerPage);
        if (activeTab === 'overview' && user?.role === 'ADMIN') fetchTelemetry();
        if (activeTab === 'management') fetchInventory(inventoryPage, debouncedInvSearch); 
        if (activeTab === 'staff_management') fetchStaff();
        if (activeTab === 'audit' && user?.role === 'ADMIN') fetchAuditLogs(); // <-- ADDED TRIGGER
    }, [activeTab, user?.role, inventoryPage, debouncedInvSearch, ledgerPage, radarPulse]); // <-- THE FIX: Added radarPulse

    // === ELITE UPGRADE: WEBSOCKET ANTENNA ===
    useEffect(() => {
        // 1. Connect to the exact port of the Backend Broadcast Tower
        const socketURL = import.meta.env.MODE === 'production' 
            ? import.meta.env.VITE_API_URL.replace('/api', '') 
            : 'http://127.0.0.1:5000';
            
        const socket = io(socketURL);

        // 2. Listen for BOTH inventory and transaction broadcasts
        socket.on('inventory_updated', () => {
            console.log("📡 God View Ping: Global inventory shift detected.");
            setRadarPulse(prev => prev + 1); // Forces the active tab to instantly refetch
        });

        socket.on('radar_updated', () => {
            console.log("📡 God View Ping: Active loan shift detected.");
            setRadarPulse(prev => prev + 1);
        });

        // 3. Clean up the antenna on unmount
        return () => socket.disconnect();
    }, []);

    // === THE FIX: AGGRESSIVE MEMORY MANAGEMENT ===
    // This prevents the browser from crashing on low-end tablets by destroying binary image blobs
    useEffect(() => {
        return () => {
            if (previewImage && previewImage.startsWith('blob:')) {
                URL.revokeObjectURL(previewImage);
            }
        };
    }, [previewImage]);
    const fetchStaff = async () => {
        try { const res = await api.get('/users/staff'); setStaffList(res.data); } 
        catch (error) { console.error("Failed to load staff"); }
    };
    // === ELITE POLISH: SEARCH-AWARE FETCHER ===
    const fetchInventory = async (page = 1, search = '') => { try { const res = await api.get(`/books?page=${page}&limit=10&search=${search}`); setInventory(res.data.books); setInventoryTotalPages(res.data.totalPages); } catch (error) { toast.error("Failed to load inventory."); } };
    const fetchActiveBorrowings = async () => { setIsLoadingReturns(true); try { const res = await api.get('/transactions/active'); setActiveBorrowings(res.data); } catch (error) { toast.error("Failed to load active loans."); } finally { setIsLoadingReturns(false); } };
    const fetchLedger = async (page = 1) => { setIsLoadingLedger(true); try { const res = await api.get(`/transactions/history?page=${page}&limit=20`); setTransactionHistory(res.data.transactions); setLedgerTotalPages(res.data.totalPages); } catch (error) { toast.error("Failed to load history."); } finally { setIsLoadingLedger(false); } };
    // === THE BUREAUCRACY ENGINE: CSV EXPORT === 
    const handleExportCSV = () => {
        if (transactionHistory.length === 0) return toast.error("No data to export.");
        const toastId = toast.loading("Generating Bureaucracy Report...");
        try {
            const headers = ['Date Processed', 'Borrower Name', 'Asset Title', 'Processed By', 'Penalty Collected (PHP)'];
            const rows = transactionHistory.map(tx => [
                new Date(tx.returnedAt || tx.updatedAt).toLocaleDateString(),
                `"${tx.user?.lastName}, ${tx.user?.firstName}"`, // Quotes prevent comma-splicing issues
                `"${tx.book?.title}"`,
                `"${tx.receivedBy?.lastName || 'System'}"`,
                tx.penaltyFee || 0
            ]);
            const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `ELEND_Ledger_Report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            toast.success("Report downloaded successfully.", { id: toastId });
        } catch (error) { toast.error("Export failed.", { id: toastId }); }
    };
    const fetchTelemetry = async () => { try { const res = await api.get('/users/telemetry'); setTelemetry(res.data); } catch (error) { setTelemetry({ totalBooks: 'N/A', activeBorrowers: 'N/A', totalPenalties: 'N/A' }); } };

    const handleBookInputChange = (e) => {
        const { name, value } = e.target;

        // 0. Anti-Number Author Shield (Letters, spaces, periods, commas, hyphens only)
        if (name === 'author') {
            if (value !== '' && !/^[a-zA-Z\sñÑ.,'-]*$/.test(value)) return;
        }

        // 1. Strict Number Locks (Prevents typing "e", letters, or negative signs)
        if (['totalCopies', 'price', 'publicationYear'].includes(name)) {
            if (value !== '' && !/^\d*$/.test(value)) return;
            if (name === 'publicationYear' && value.length > 4) return;
        }

        // 2. ISBN Lock (Numbers and hyphens only, max 13 physical digits)
        if (name === 'isbn') {
            if (value !== '' && !/^[\d-]*$/.test(value)) return;
            if (value.replace(/-/g, '').length > 13) return; 
        }

        setBookForm({ ...bookForm, [name]: value });
    };
    const handleImageChange = (e) => { const file = e.target.files[0]; if (file) { setCoverImage(file); setPreviewImage(URL.createObjectURL(file)); } };
    
    const handleCatalogBook = async (e) => {
        e.preventDefault(); 
        
        // === EXPLICIT FRONTEND VALIDATION (Specific Error Messages) ===
        if (bookForm.publicationYear && String(bookForm.publicationYear).length !== 4) {
            return toast.error("Validation Error: Published Year must be exactly 4 digits (e.g., 2024).");
        }
        if (bookForm.isbn && bookForm.isbn.replace(/-/g, '').length > 0 && bookForm.isbn.replace(/-/g, '').length < 10) {
            return toast.error("Validation Error: ISBN must be at least 10 digits.");
        }
        if (!bookForm.genre) {
            return toast.error("Validation Error: Please select or type a Genre.");
        }

        setIsCataloging(true); 
        const loadingToast = toast.loading("Processing data...");
        
        try {
            const data = new FormData(); 
            Object.keys(bookForm).forEach(key => {
                // 🚨 THE FIX: Strip hyphens from ISBN before sending to Mongoose to bypass the 13-char limit trap
                if (bookForm[key] !== '' && bookForm[key] !== null) {
                    let finalValue = bookForm[key];
                    if (key === 'isbn') finalValue = String(finalValue).replace(/-/g, '');
                    data.append(key, finalValue);
                }
            });
            
            if (coverImage) data.append('coverImage', coverImage);
            
            if (editingBookId) { 
                await api.patch(`/books/${editingBookId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }); 
                toast.success("Asset updated!", { id: loadingToast }); 
            } else { 
                data.append('availableCopies', bookForm.totalCopies); 
                await api.post('/books', data, { headers: { 'Content-Type': 'multipart/form-data' } }); 
                toast.success("Asset secured!", { id: loadingToast }); 
            }
            
            setBookForm({ title: '', author: '', genre: '', description: '', totalCopies: 1, isbn: '', shelfLocation: '', publicationYear: '', price: 500 }); 
            setCoverImage(null); 
            setPreviewImage(null); 
            setEditingBookId(null); 
            fetchInventory();
        } catch (error) { 
            console.error("🔥 RAW SERVER REJECTION:", error.response);
            
            // 🚨 THE FIX: Upgraded X-Ray to prioritize detailed Mongoose validation errors
            let exactError = "Unknown Server Error";
            if (error.response?.data?.error) exactError = error.response.data.error; // Catches deep DB errors first
            else if (error.response?.data?.message) exactError = error.response.data.message;
            else if (typeof error.response?.data === 'string') exactError = "Backend sent HTML instead of JSON. Check console.";
            else if (error.message) exactError = error.message;

            toast.error(`🚨 SERVER SAID: ${exactError}`, { id: loadingToast, duration: 8000 }); 
        } finally { 
            setIsCataloging(false); 
        }
    };

    const handleEditBook = (book) => {
        setEditingBookId(book._id); setPreviewImage(book.coverImageUrl);
        setBookForm({ title: book.title, author: book.author, genre: book.genre, description: book.description || '', totalCopies: book.totalCopies, isbn: book.isbn || '', shelfLocation: book.shelfLocation || '', publicationYear: book.publicationYear || '', price: book.price || 500 });
    };

    const handleToggleStatus = async (bookId) => { try { await api.patch(`/books/${bookId}/status`); fetchInventory(); toast.success("Status updated."); } catch (error) { toast.error("Failed to update status."); } };

    const handleLookupCode = async (e) => {
        e.preventDefault(); if (reservationCode.length !== 6) return toast.error("Invalid Code.");
        setIsScanning(true); setScanResult(null);
        try { const res = await api.get(`/transactions/lookup/${reservationCode}`); setPendingVerification(res.data); toast.success("Code Authenticated."); } 
        catch (error) { setPendingVerification(null); toast.error(error.response?.data?.message || "Code not found."); } finally { setIsScanning(false); }
    };

    const handleConfirmRelease = async () => {
        const loadingToast = toast.loading("Releasing Assets...");
        try { const res = await api.post('/transactions/verify', { reservationCode }); setScanResult(res.data); setPendingVerification(null); setReservationCode(''); toast.success(res.data.message, { id: loadingToast }); fetchActiveBorrowings(); } 
        catch (error) { toast.error(error.response?.data?.message || "Verification failed.", { id: loadingToast }); }
    };

    const executeReturn = async () => {
        if (!returnTarget) return;
        setIsLoadingReturns(true); 
        const loadingToast = toast.loading("Processing physical return...");
        try { 
            const res = await api.post('/transactions/return', { 
                transactionId: returnTarget.transactionId, 
                returnCondition: returnCondition 
            }); 
            toast.success(res.data.message, { id: loadingToast }); 
            fetchActiveBorrowings(); 
        } 
        catch (error) { toast.error(error.response?.data?.message || "Return failed.", { id: loadingToast }); } 
        finally { 
            setIsLoadingReturns(false); 
            setReturnTarget(null);
            setReturnCondition('Good');
        }
    };

    const handleSettleFine = (transactionId) => {
        setConfirmDialog({
            isOpen: true,
            title: "Process Cash Payment",
            message: "Confirm receipt of physical cash? This will permanently wipe the student's fine from the system.",
            type: "success",
            onConfirm: async () => {
                const loadingToast = toast.loading("Processing payment...");
                try { 
                    await api.post(`/transactions/${transactionId}/settle-fine`); 
                    toast.success("Payment cleared.", { id: loadingToast }); 
                    fetchActiveBorrowings(); 
                    fetchLedger(ledgerPage); // Updates the ledger instantly
                } catch (error) { toast.error("Payment processing failed.", { id: loadingToast }); }
            }
        });
    };

    const handleBlacklistToggle = (userId) => {
        setConfirmDialog({
            isOpen: true,
            title: "Modify Security Clearance",
            message: "WARNING: Are you sure you want to change this user's access status? This immediately affects their ability to log in.",
            type: "danger",
            onConfirm: async () => {
                setIsBlacklisting(true); const loadingToast = toast.loading("Updating clearance...");
                try { 
                    const res = await api.patch(`/users/${userId}/blacklist`); 
                    toast.success(res.data.message, { id: loadingToast }); 
                    setSelectedUser(null); 
                    fetchActiveBorrowings(); 
                    fetchStaff();
                } catch (error) { toast.error(error.response?.data?.message || "Failed update.", { id: loadingToast }); } 
                finally { setIsBlacklisting(false); }
            }
        });
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault(); setIsCreatingStaff(true); const loadingToast = toast.loading("Forging credentials...");
        try { await api.post('/users/staff', staffForm); toast.success(`${staffForm.role} account created!`, { id: loadingToast }); setShowStaffModal(false); setStaffForm({ firstName: '', lastName: '', email: '', password: '', role: 'LIBRARIAN' }); } 
        catch (error) { toast.error(error.response?.data?.message || "Failed to create.", { id: loadingToast }); } finally { setIsCreatingStaff(false); }
    };

    const SidebarTab = ({ id, icon: Icon, label, isAdminOnly }) => {
        if (isAdminOnly && user?.role !== 'ADMIN') return null; const isActive = activeTab === id;
        return ( <button onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl font-bold transition-all duration-300 ${isActive ? 'bg-rose-800 text-white shadow-lg shadow-rose-900/20' : 'text-gray-500 hover:bg-gray-200/50 dark:hover:bg-gray-800 dark:text-gray-400'}`}> <Icon className={`h-5 w-5 ${isActive ? 'text-amber-400' : 'text-gray-400'}`} strokeWidth={isActive ? 2.5 : 2} /> <span className="tracking-wide">{label}</span> </button> );
    };

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-[#FCFBF8] dark:bg-[#0A0506] mt-2 border border-gray-200/60 dark:border-rose-950/30 rounded-3xl shadow-2xl max-w-[1400px] mx-auto transition-colors duration-300">
            <div className="w-72 bg-white dark:bg-[#0F0809] border-r border-gray-200/60 dark:border-rose-900/20 flex flex-col py-6 px-4 z-10 hidden md:flex transition-colors duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                
                {/* === NEW FEATURE: MNHS BRANDING HEADER === */}
                <div className="flex items-center gap-3 px-4 mb-8 pb-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="relative h-12 w-12 flex items-center justify-center shrink-0">
                        <Shield className="absolute inset-0 h-12 w-12 text-rose-800" strokeWidth={1.5} />
                        <GraduationCap className="h-6 w-6 text-amber-500 z-10 relative bottom-0.5" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="font-black text-gray-900 dark:text-white leading-none tracking-tight">MNHS<br/><span className="text-rose-700 dark:text-rose-500 text-sm">E-LIBRARY</span></h2>
                    </div>
                </div>

                <div className="space-y-1.5 flex-1">
                    <SidebarTab id="overview" icon={LayoutGrid} label="Overview" isAdminOnly={true} />
                    <SidebarTab id="management" icon={BookPlus} label="Library Inventory" />
                    <SidebarTab id="loans" icon={Users} label="Active Borrowers" />
                    <SidebarTab id="overdue_inbox" icon={AlertCircle} label="Overdue Inbox" />
                    <SidebarTab id="verification" icon={ScanBarcode} label="Verification" />
                    <SidebarTab id="ledger" icon={History} label="Transaction Ledger" />
                    <SidebarTab id="public_catalog" icon={BookOpen} label="Public Catalog" />
                    <SidebarTab id="staff_management" icon={UserPlus} label="Staff Management" isAdminOnly={true} />
                    <SidebarTab id="audit" icon={ShieldCheck} label="Security Audit" isAdminOnly={true} /> {/* THE GOD VIEW */}
                </div>
                <div className="pt-6 border-t border-gray-200 dark:border-gray-800 mt-auto">
                    <button onClick={toggleTheme} className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all active:scale-95">
                        <span className="flex items-center gap-3">{isDarkMode ? <Moon className="h-5 w-5 text-blue-400" /> : <Sun className="h-5 w-5 text-amber-500" />} {isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}><div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`} /></div>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#FCFBF8] dark:bg-[#0A0506] p-8 md:p-12 relative transition-colors duration-300">
                <div className="mb-10 flex justify-between items-end border-b border-gray-200/60 dark:border-rose-950/30 pb-6 transition-colors">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3"><Library className="h-8 w-8 text-rose-800" /> {user?.role === 'ADMIN' ? 'Library Administration' : 'Librarian Dashboard'}</h1>
                </div>

                <AnimatePresence mode="wait">
                    
                    {/* === TAB: OVERVIEW === */}
                    {activeTab === 'overview' && user?.role === 'ADMIN' && (
                        <motion.div key="overview" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Library Analytics Core</h2>
                            {telemetry ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-rose-800 to-rose-950 rounded-3xl p-6 text-white shadow-lg shadow-rose-900/20 flex flex-col justify-between h-40 relative overflow-hidden transition-all border border-rose-700">
                                            <div className="absolute -right-6 -top-6 text-rose-500/20"><Book className="h-32 w-32" /></div><span className="text-amber-400 font-black tracking-wider uppercase text-xs z-10">Total Physical Assets</span><p className="text-5xl font-black z-10">{telemetry.totalBooks}</p>
                                        </motion.div>
                                        <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-green-500 to-green-700 rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between h-40 relative overflow-hidden transition-all">
                                            <div className="absolute -right-6 -top-6 text-green-400/30"><Users className="h-32 w-32" /></div><span className="text-green-100 font-bold tracking-wider uppercase text-sm z-10">Active Borrowers</span><p className="text-5xl font-black z-10">{telemetry.activeBorrowers}</p>
                                        </motion.div>
                                        <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-red-500 to-red-700 rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between h-40 relative overflow-hidden transition-all">
                                            <div className="absolute -right-6 -top-6 text-red-400/30"><DollarSign className="h-32 w-32" /></div><span className="text-red-100 font-bold tracking-wider uppercase text-sm z-10">Unpaid Fines Generated</span><p className="text-5xl font-black z-10">₱{telemetry.totalPenalties}</p>
                                        </motion.div>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all duration-300"><h3 className="text-lg font-black text-gray-900 dark:text-white mb-6">Asset Taxonomy</h3><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}><PieChart><Pie data={telemetry.genreDistribution} innerRadius={85} outerRadius={120} paddingAngle={5} dataKey="value" stroke="none">{telemetry.genreDistribution?.map((entry, index) => (<Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />))}</Pie><Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}} /><Legend iconType="circle" verticalAlign="bottom" wrapperStyle={{paddingTop: '20px', fontSize: '12px', fontWeight: 'bold', color: '#64748b'}} /></PieChart></ResponsiveContainer></div></div>
                                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 shadow-sm hover:shadow-lg transition-all duration-300"><h3 className="text-lg font-black text-gray-900 dark:text-white mb-6">Platform Engagement</h3><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}><BarChart data={[{ name: 'Assets', count: telemetry.totalBooks }, { name: 'Loans', count: telemetry.activeBorrowers }, { name: 'Students', count: telemetry.totalUsers }]} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 700}} dy={10} /><Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}} /><Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={45}>{['#3b82f6', '#10b981', '#f59e0b'].map((color, index) => (<Cell key={`cell-${index}`} fill={color} />))}</Bar></BarChart></ResponsiveContainer></div></div>
                                    </div>
                                </>
                            ) : (
                                // === NEW FEATURE: ENTERPRISE SKELETON ENGINE (OVERVIEW) ===
                                <div className="animate-pulse">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        {[1, 2, 3].map(i => <div key={i} className="bg-gray-200 dark:bg-gray-800/50 rounded-3xl p-6 h-40"></div>)}
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                                        <div className="bg-gray-200 dark:bg-gray-800/50 rounded-3xl h-[380px]"></div>
                                        <div className="bg-gray-200 dark:bg-gray-800/50 rounded-3xl h-[380px]"></div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* === TAB: BOOK MANAGEMENT === */}
                    {activeTab === 'management' && (
                        <motion.div key="management" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
                            {/* === ELITE POLISH: INVENTORY HEADER & LIVE SEARCH === */}
                            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Library Inventory</h2>
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <input 
                                        type="text" placeholder="Search MNHS Vault..." value={inventorySearch} onChange={(e) => { setInventorySearch(e.target.value); setInventoryPage(1); }}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0F0809] border border-gray-200/60 dark:border-rose-900/30 rounded-xl text-sm focus:ring-2 focus:ring-rose-800 outline-none text-gray-900 dark:text-white transition-all shadow-inner"
                                    />
                                </div>
                                <button onClick={() => setEditingBookId('new')} className="w-full sm:w-auto bg-rose-800 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-rose-900/20 hover:bg-rose-900 active:scale-95 transition-all flex items-center justify-center gap-2 border border-rose-700"><BookPlus className="h-5 w-5 text-amber-400"/> Register Asset</button>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm transition-colors duration-300">
                                <table className="w-full text-left border-collapse">
                                    <thead><tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"><th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Asset</th><th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th><th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Shelf</th><th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th></tr></thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        <AnimatePresence>
                                            {inventory.length === 0 ? (
                                                <tr><td colSpan="4" className="p-10 text-center text-gray-500 font-bold">No assets match your search query.</td></tr>
                                            ) : inventory.map(book => (
                                                <motion.tr layout key={book._id} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className={`group transition-colors ${!book.isActive ? 'bg-red-50/30 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                                                    <td className="p-5 flex items-center gap-4"><img src={book.coverImageUrl} className="w-12 h-16 object-cover rounded shadow-sm border border-gray-200 dark:border-gray-700 group-hover:scale-105 transition-transform" /><div><p className="font-bold text-gray-900 dark:text-white line-clamp-1">{book.title}</p><p className="text-xs text-gray-500 font-medium mt-0.5">{book.author}</p></div></td>
                                                    <td className="p-5">
                                                        <p className={`font-black text-lg ${book.availableCopies === 0 ? 'text-red-500 dark:text-red-400' : book.availableCopies <= 3 ? 'text-amber-500 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                                                            {book.availableCopies} <span className="text-gray-400 font-medium text-sm">/ {book.totalCopies}</span>
                                                        </p>
                                                    </td>
                                                    <td className="p-5"><span className="font-mono text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">{book.shelfLocation}</span></td>
                                                    <td className="p-5 text-right flex justify-end gap-2">
                                                        <button onClick={() => handleEditBook(book)} title="Edit Asset" className="p-2.5 text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition-all active:scale-95"><Edit className="h-4 w-4" /></button>
                                                        <button onClick={() => handleToggleStatus(book._id)} title={book.isActive ? 'Archive Asset' : 'Restore Asset'} className={`p-2.5 rounded-xl transition-all active:scale-95 ${book.isActive ? 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50' : 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'}`}>{book.isActive ? <Archive className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}</button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                                {inventoryTotalPages > 1 && (<div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-5 border-t border-gray-200 dark:border-gray-800"><button onClick={() => setInventoryPage(p => Math.max(1, p - 1))} disabled={inventoryPage === 1} className="px-5 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 transition-all text-sm shadow-sm active:scale-95 disabled:opacity-50">Previous</button><span className="font-bold text-gray-500 text-sm">Page {inventoryPage} of {inventoryTotalPages}</span><button onClick={() => setInventoryPage(p => Math.min(inventoryTotalPages, p + 1))} disabled={inventoryPage === inventoryTotalPages} className="px-5 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 transition-all text-sm shadow-sm active:scale-95 disabled:opacity-50">Next</button></div>)}
                            </div>
                        </motion.div>
                    )}

                    {/* === TAB: ACTIVE LOANS === */}
                    {activeTab === 'loans' && (
                        <motion.div key="loans" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
                            <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black text-gray-900 dark:text-white">Active Borrowers</h2><span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-bold px-4 py-1.5 rounded-full border border-blue-200 dark:border-blue-800 shadow-sm">{activeBorrowings.length} Active Records</span></div>
                            {isLoadingReturns ? ( 
                                // === NEW FEATURE: ENTERPRISE SKELETON ENGINE (ACTIVE LOANS) ===
                                <div className="grid gap-4 animate-pulse">
                                    {[1, 2, 3].map(i => <div key={i} className="bg-gray-100 dark:bg-gray-800/50 p-5 rounded-3xl h-32"></div>)}
                                </div> 
                            ) : activeBorrowings.length === 0 ? ( <div className="text-center py-24 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700"><CheckCircle className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" /><h3 className="text-xl font-bold text-gray-600 dark:text-gray-400">All Clear</h3><p className="text-gray-400 mt-1">No outstanding assets in the field.</p></div> ) : (
                                <motion.div layout className="grid gap-6">
                                    <AnimatePresence>
                                        {/* Grouping Engine: Combines transactions by User ID */}
                                        {Object.values(activeBorrowings.reduce((acc, tx) => {
                                            const userId = tx.user?._id || 'unknown';
                                            if (!acc[userId]) acc[userId] = { user: tx.user, transactions: [] };
                                            acc[userId].transactions.push(tx);
                                            return acc;
                                        }, {})).map((group) => (
                                            <motion.div layout initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} transition={springAnim} key={group.user?._id || Math.random()} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 group">
                                                
                                                {/* Header: Student Dossier */}
                                                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center font-black text-xl border border-blue-200 dark:border-blue-800">
                                                            {group.user?.firstName?.charAt(0)}{group.user?.lastName?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-black text-gray-900 dark:text-white text-xl leading-tight uppercase tracking-tight">
                                                                {group.user?.lastName}, {group.user?.firstName}
                                                            </h3>
                                                            <button onClick={() => setSelectedUser(group.user)} className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1.5 mt-0.5">
                                                                <UserCheck className="h-4 w-4"/> View Full Profile
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <span className="bg-blue-600 text-white text-xs font-black px-4 py-2 rounded-xl shadow-sm tracking-wide">
                                                        {group.transactions.length} ASSET{group.transactions.length > 1 ? 'S' : ''}
                                                    </span>
                                                </div>
                                                
                                                {/* Body: Assets List */}
                                                <div className="p-2 divide-y divide-gray-100 dark:divide-gray-800">
                                                    {group.transactions.map(tx => {
                                                        // Dynamic Date Calculation Engine
                                                        const due = new Date(tx.dueDate);
                                                        const now = new Date();
                                                        due.setHours(0,0,0,0); now.setHours(0,0,0,0);
                                                        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
                                                        
                                                        let timeStatus = { text: `🟢 ${diffDays} days left`, color: 'text-green-700 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' };
                                                        if (diffDays < 0) timeStatus = { text: `🔴 Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''}`, color: 'text-red-700 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800' };
                                                        else if (diffDays === 0) timeStatus = { text: `🟠 Due Today`, color: 'text-orange-700 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800' };
                                                        else if (diffDays <= 2) timeStatus = { text: `🟡 ${diffDays} days left`, color: 'text-yellow-700 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800' };

                                                        return (
                                                            <div key={tx._id} className="p-4 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors rounded-2xl">
                                                                <div className="flex items-center gap-5 w-full md:w-auto">
                                                                    <img src={tx.book?.coverImageUrl} alt="Cover" className="w-14 h-20 object-cover rounded-lg shadow-sm border border-gray-200 dark:border-gray-700" />
                                                                    <div>
                                                                        <h4 className="font-bold text-gray-900 dark:text-white leading-tight mb-2 text-lg">{tx.book?.title}</h4>
                                                                        <span className={`text-xs font-black inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${timeStatus.color}`}>
                                                                            <Clock className="h-3.5 w-3.5" /> {timeStatus.text}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col md:flex-row md:items-center w-full md:w-auto gap-3">
                                                                    {tx.penaltyFee > 0 && (
                                                                        <div className="flex items-center justify-between md:justify-start gap-3 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 rounded-xl border border-red-100 dark:border-red-900/50 w-full md:w-auto">
                                                                            <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-black text-sm"><AlertCircle className="h-4 w-4" /> ₱{tx.penaltyFee}</span>
                                                                            <button onClick={() => handleSettleFine(tx._id)} className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm transition-all active:scale-95 text-xs flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Clear Fine</button>
                                                                        </div>
                                                                    )}
                                                                    <button onClick={() => setReturnTarget({ transactionId: tx._id, bookTitle: tx.book?.title })} className="w-full md:w-auto px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-md transition-all active:scale-95 hover:bg-gray-800 dark:hover:bg-gray-100 text-sm border border-gray-700 dark:border-gray-300">Process Return</button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* === TAB: OVERDUE INBOX === */}
                    {activeTab === 'overdue_inbox' && (
                        <motion.div key="overdue_inbox" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
                            <div className="flex justify-between items-center mb-8">
                                <div><h2 className="text-2xl font-black text-red-600 dark:text-red-500 flex items-center gap-3"><AlertCircle className="h-8 w-8" /> Action Required: Overdue Assets</h2><p className="text-gray-500 font-medium mt-1">Manual communication dossiers for students with late returns.</p></div>
                            </div>

                            {(() => {
                                // 1. Filter out ONLY the transactions that are overdue
                                const overdueTx = activeBorrowings.filter(tx => {
                                    const due = new Date(tx.dueDate); due.setHours(0,0,0,0);
                                    const now = new Date(); now.setHours(0,0,0,0);
                                    return due < now;
                                });

                                if (isLoadingReturns) return <div className="animate-pulse h-32 bg-gray-100 dark:bg-gray-800/50 rounded-3xl"></div>;

                                // 2. If no one is late, show an "All Clear" screen
                                if (overdueTx.length === 0) return (
                                    <div className="text-center py-24 bg-green-50 dark:bg-green-900/20 rounded-3xl border border-green-200 dark:border-green-900/50">
                                        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                                        <h3 className="text-xl font-bold text-green-700 dark:text-green-400">Zero Overdue Assets</h3>
                                        <p className="text-green-600/70 mt-1 font-medium">All borrowers are currently within their designated timeframes.</p>
                                    </div>
                                );

                                // 3. Group the late transactions by Student ID
                                const groupedOverdue = Object.values(overdueTx.reduce((acc, tx) => {
                                    const userId = tx.user?._id || 'unknown';
                                    if (!acc[userId]) acc[userId] = { user: tx.user, transactions: [] };
                                    acc[userId].transactions.push(tx);
                                    return acc;
                                }, {}));

                                return (
                                    <motion.div layout className="grid gap-6">
                                        <AnimatePresence>
                                            {groupedOverdue.map(group => (
                                                <motion.div key={group.user._id} className="bg-white dark:bg-gray-900 border-2 border-red-100 dark:border-red-900/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all">
                                                    
                                                    {/* Dossier Header */}
                                                    <div className="bg-red-50 dark:bg-red-900/10 p-6 border-b border-red-100 dark:border-red-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                        <div className="flex items-center gap-5">
                                                            <div className="h-14 w-14 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center font-black text-2xl border border-red-200 dark:border-red-800">
                                                                {group.user?.firstName?.charAt(0)}{group.user?.lastName?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-black text-gray-900 dark:text-white text-2xl uppercase tracking-tight">{group.user.lastName}, {group.user.firstName}</h3>
                                                                <p className="text-red-600 dark:text-red-400 font-bold mt-1 text-sm">{group.user.classification} • {group.transactions.length} Overdue Asset(s)</p>
                                                            </div>
                                                        </div>

                                                        {/* Contact Info Card (Clickable links!) */}
                                                        <div className="bg-white dark:bg-gray-950 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 flex flex-col gap-3 min-w-[250px] shadow-sm">
                                                            <a href={`tel:${group.user.contactNumber}`} className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-green-600 transition-colors"><Phone className="h-4 w-4 text-green-500"/> {group.user.contactNumber}</a>
                                                            <a href={`mailto:${group.user.email}`} className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors"><Mail className="h-4 w-4 text-blue-500"/> {group.user.email}</a>
                                                            <div className="flex items-start gap-3 text-sm font-bold text-gray-700 dark:text-gray-300"><MapPin className="h-4 w-4 text-orange-500 mt-0.5 shrink-0"/> <span className="leading-snug">{group.user.address}</span></div>
                                                        </div>
                                                    </div>

                                                    {/* Late Assets List */}
                                                    <div className="p-2 divide-y divide-gray-100 dark:divide-gray-800">
                                                        {group.transactions.map(tx => {
                                                            const diffDays = Math.ceil((new Date() - new Date(tx.dueDate)) / (1000 * 60 * 60 * 24));
                                                            return (
                                                                <div key={tx._id} className="p-4 flex items-center justify-between">
                                                                    <div className="flex items-center gap-4">
                                                                        <img src={tx.book?.coverImageUrl} className="w-12 h-16 object-cover rounded-lg shadow-sm border border-gray-200 dark:border-gray-700" />
                                                                        <div>
                                                                            <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{tx.book?.title}</h4>
                                                                            <span className="text-xs font-black text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-md mt-2 inline-block">🔴 Overdue by {diffDays} days</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>

                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })()}
                        </motion.div>
                    )}

                    {/* === TAB: VERIFICATION === */}
                    {activeTab === 'verification' && (
                        <motion.div key="verification" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
                            <div className="max-w-2xl mx-auto bg-white dark:bg-[#0F0809] p-12 rounded-[2.5rem] border border-gray-200/60 dark:border-rose-950/30 shadow-2xl mt-4 text-center transition-colors">
                                <div className="mx-auto bg-rose-50 dark:bg-rose-900/20 h-24 w-24 rounded-full flex items-center justify-center mb-8 border border-rose-100 dark:border-rose-900/30"><ScanBarcode className="h-12 w-12 text-rose-800 dark:text-rose-500" /></div>
                                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-3 uppercase tracking-tight">MNHS Identity Scanner</h2>
                                <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg font-medium">Scan or enter the student's 6-digit Vault Code.</p>
                                <form onSubmit={handleLookupCode} className="flex gap-4 mb-4 max-w-lg mx-auto">
                                    <input type="text" maxLength="6" placeholder="000000" value={reservationCode} onChange={(e) => setReservationCode(e.target.value.replace(/\D/g, ''))} className="w-full text-center text-5xl tracking-[0.3em] font-black px-6 py-6 bg-[#FCFBF8] dark:bg-[#0A0506] border-2 border-gray-200/60 dark:border-rose-900/30 rounded-3xl focus:border-rose-800 dark:focus:border-rose-700 outline-none transition-all text-gray-900 dark:text-white shadow-inner" />
                                    <button type="submit" disabled={isScanning || reservationCode.length !== 6} className={`px-10 rounded-3xl text-white font-black transition-all text-lg border border-transparent ${isScanning || reservationCode.length !== 6 ? 'bg-gray-300 dark:bg-gray-800 cursor-not-allowed' : 'bg-rose-800 hover:bg-rose-900 active:scale-95 shadow-xl hover:shadow-rose-900/30 border-rose-700'}`}>VERIFY</button>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {/* === TAB: STAFF MANAGEMENT (NOW A MODAL TRIGGER) === */}
                    {activeTab === 'staff_management' && user?.role === 'ADMIN' && (
                        <motion.div key="staff_management" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
                            <div className="flex justify-between items-center mb-8">
                                <div><h2 className="text-2xl font-black text-gray-900 dark:text-white">Staff Management</h2><p className="text-gray-500 font-medium mt-1">Manage library administrative credentials.</p></div>
                                <button onClick={() => setShowStaffModal(true)} className="bg-gray-900 dark:bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg active:scale-95 transition-all flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-blue-700"><UserPlus className="h-5 w-5"/> Deploy New Staff</button>
                            </div>
                            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm transition-colors duration-300 mt-6">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                            <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Member</th>
                                            <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Clearance Level</th>
                                            <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Security Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {staffList.length === 0 ? (
                                            <tr><td colSpan="4" className="p-10 text-center text-gray-500 font-bold">No additional staff members found.</td></tr>
                                        ) : staffList.map(staff => (
                                            <tr key={staff._id} className={`transition-colors ${!staff.isActive ? 'bg-red-50/30 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                                                <td className="p-5">
                                                    <p className="font-bold text-gray-900 dark:text-white uppercase">{staff.lastName}, {staff.firstName}</p>
                                                    <p className="text-xs text-gray-500 font-medium mt-1">{staff.email}</p>
                                                </td>
                                                <td className="p-5"><span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-xs font-black px-3 py-1.5 rounded-lg uppercase border border-blue-200 dark:border-blue-800/50">{staff.role}</span></td>
                                                <td className="p-5"><span className={`px-3 py-1.5 text-xs font-black rounded-lg border ${staff.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50'}`}>{staff.isActive ? 'ACTIVE' : 'ACCESS REVOKED'}</span></td>
                                                <td className="p-5 text-right">
                                                    {user._id !== staff._id && (
                                                        <button onClick={() => handleBlacklistToggle(staff._id)} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${staff.isActive ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50' : 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50'}`}>
                                                            {staff.isActive ? 'Revoke Access' : 'Restore Access'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* === TAB: TRANSACTION LEDGER === */}
                    {activeTab === 'ledger' && ( 
                        <motion.div key="ledger" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3"><History className="h-8 w-8 text-blue-600" /><div><h2 className="text-2xl font-black text-gray-900 dark:text-white">Transaction Ledger</h2><p className="text-gray-500 font-medium mt-1">Immutable record of all completed assets.</p></div></div>
                                <button onClick={handleExportCSV} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3.5 rounded-2xl font-bold shadow-lg active:scale-95 transition-all flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-100">
                                    Download CSV Report
                                </button>
                            </div>
                            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm transition-colors">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                            <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Borrower</th>
                                            <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Asset</th>
                                            <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Processor</th>
                                            <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Penalty Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {isLoadingLedger ? (
                                            [1, 2, 3, 4, 5].map(i => (
                                                <tr key={i} className="animate-pulse border-b border-gray-100 dark:border-gray-800">
                                                    <td className="p-5"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                                                    <td className="p-5"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div></td>
                                                    <td className="p-5"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div></td>
                                                    <td className="p-5"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div></td>
                                                    <td className="p-5"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 ml-auto"></div></td>
                                                </tr>
                                            ))
                                        ) : transactionHistory.map(tx => (
                                            <tr key={tx._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="p-5"><p className="font-bold text-gray-900 dark:text-white">{new Date(tx.returnedAt).toLocaleDateString()}</p></td>
                                                
                                                <td className="p-5">
                                                    {/* 🚨 THE FIX: Clickable Student Name to open the Contact Dossier */}
                                                    <button onClick={() => setSelectedUser(tx.user)} className="text-left hover:text-blue-600 transition-colors group">
                                                        <p className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 uppercase tracking-tight">{tx.user?.lastName}, {tx.user?.firstName}</p>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><UserCheck className="h-3 w-3"/> View Credentials</p>
                                                    </button>
                                                </td>
                                                
                                                <td className="p-5"><p className="font-bold text-gray-900 dark:text-white line-clamp-1">{tx.book?.title}</p></td>
                                                <td className="p-5"><span className="font-bold text-gray-700 dark:text-gray-300 uppercase">{tx.receivedBy?.lastName || 'System'}</span></td>
                                                
                                                <td className="p-5 text-right flex flex-col items-end gap-2">
                                                    {/* 🚨 THE FIX: Visual indicator of unpaid fines vs settled fines */}
                                                    {tx.penaltyFee > 0 ? (
                                                        <>
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-sm text-red-700 bg-red-100 border border-red-200">
                                                                Unpaid: ₱{tx.penaltyFee}
                                                            </span>
                                                            <button onClick={() => { handleSettleFine(tx._id); setTimeout(() => fetchLedger(ledgerPage), 1000); }} className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-md transition-all active:scale-95 shadow-sm">
                                                                Collect Cash
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400 font-bold text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">Settled / None</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
    {ledgerTotalPages > 1 && (
        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-5 border-t border-gray-200 dark:border-gray-800">
            <button onClick={() => setLedgerPage(p => Math.max(1, p - 1))} disabled={ledgerPage === 1} className="px-5 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 transition-all text-sm shadow-sm active:scale-95 disabled:opacity-50">Previous</button>
            <span className="font-bold text-gray-500 text-sm">Page {ledgerPage} of {ledgerTotalPages}</span>
            <button onClick={() => setLedgerPage(p => Math.min(ledgerTotalPages, p + 1))} disabled={ledgerPage === ledgerTotalPages} className="px-5 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 transition-all text-sm shadow-sm active:scale-95 disabled:opacity-50">Next</button>
        </div>
    )}
</div></motion.div> )}
                    {activeTab === 'public_catalog' && ( <motion.div key="public_catalog" variants={tabVariants} initial="hidden" animate="visible" exit="exit"><Catalog /></motion.div> )}
                    
                    {/* === TAB: SECURITY AUDIT (GOD VIEW) === */}
                    {activeTab === 'audit' && user?.role === 'ADMIN' && ( 
                        <motion.div key="audit" variants={tabVariants} initial="hidden" animate="visible" exit="exit">
                            <div className="flex items-center gap-3 mb-8"><ShieldCheck className="h-8 w-8 text-red-600" /><div><h2 className="text-2xl font-black text-gray-900 dark:text-white">System Activity Logs</h2><p className="text-gray-500 font-medium mt-1">Immutable ledger of administrative actions.</p></div></div>
                            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead><tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"><th className="p-5 text-xs font-bold text-gray-500 uppercase">Timestamp</th><th className="p-5 text-xs font-bold text-gray-500 uppercase">Processor</th><th className="p-5 text-xs font-bold text-gray-500 uppercase">Action Vector</th><th className="p-5 text-xs font-bold text-gray-500 uppercase">Cryptographic Details</th></tr></thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {isLoadingAudit ? (
                                            <tr><td colSpan="4" className="p-10 text-center"><div className="animate-pulse flex space-x-4 justify-center"><div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div></div></td></tr>
                                        ) : auditLogs.length === 0 ? (
                                            <tr><td colSpan="4" className="p-10 text-center text-gray-500 font-bold">No anomalies detected. System is secure.</td></tr>
                                        ) : auditLogs.map(log => (
                                            <tr key={log._id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors">
                                                <td className="p-5 font-mono text-xs text-gray-500 dark:text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                                                <td className="p-5"><span className="font-bold text-gray-900 dark:text-white uppercase">{log.performedBy?.lastName}, {log.performedBy?.firstName}</span><br/><span className="text-xs text-red-600 dark:text-red-400 font-black">{log.performedBy?.role}</span></td>
                                                <td className="p-5"><span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-black px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800/50">{log.actionType}</span></td>
                                                <td className="p-5 text-sm font-medium text-gray-700 dark:text-gray-300">{log.description}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div> 
                    )}
                </AnimatePresence>
            </div>

            {/* === GLOBAL MODALS (SPATIAL UI) === */}
            <AnimatePresence>
                
                {/* 1. EDIT/ADD BOOK MODAL */}
                {editingBookId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" onClick={() => { setEditingBookId(null); setPreviewImage(null); }} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
                        <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden w-full max-w-5xl relative z-10 p-10 max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-800">
                            <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-black text-gray-900 dark:text-white">{editingBookId === 'new' ? 'Register New Asset' : 'Edit Resource Data'}</h2><button onClick={() => { setEditingBookId(null); setPreviewImage(null); }} className="text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full transition-colors"><XCircle className="h-8 w-8" /></button></div>
                            <form onSubmit={handleCatalogBook} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Book Title *</label><input required type="text" name="title" value={bookForm.title} onChange={handleBookInputChange} className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-gray-900 dark:text-white transition-all text-lg" /></div>
                                    <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Author *</label><input required type="text" name="author" value={bookForm.author} onChange={handleBookInputChange} className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-gray-900 dark:text-white transition-all text-lg" /></div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* === SMART GENRE MANAGER UI === */}
                                        <div className="relative">
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Genre *</label>
                                            <div onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)} className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl flex justify-between items-center cursor-pointer text-gray-900 dark:text-white transition-all text-lg">
                                                <span className={`truncate block pr-2 w-full text-left ${bookForm.genre ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
    {bookForm.genre || "Select genre..."}
</span>
                                                <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isGenreDropdownOpen ? 'rotate-180' : ''}`} />
                                            </div>

                                            {isGenreDropdownOpen && (
                                                <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
                                                    {/* Add New Genre Row */}
                                                    <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex gap-2 bg-gray-50 dark:bg-gray-950/50">
                                                        <input type="text" value={newGenreInput} onChange={(e) => setNewGenreInput(e.target.value)} placeholder="Type new genre..." className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 px-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('add-genre-btn').click(); } }} />
                                                        <button id="add-genre-btn" type="button" onClick={(e) => { e.stopPropagation(); if (newGenreInput.trim() && !availableGenres.includes(newGenreInput.trim())) { setAvailableGenres([newGenreInput.trim(), ...availableGenres]); setBookForm({ ...bookForm, genre: newGenreInput.trim() }); setNewGenreInput(''); setIsGenreDropdownOpen(false); } }} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors active:scale-95">
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    {/* Genre List */}
                                                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                        {availableGenres.map(g => (
                                                            <div key={g} onClick={() => { setBookForm({ ...bookForm, genre: g }); setIsGenreDropdownOpen(false); }} className="px-5 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer flex justify-between items-center text-gray-700 dark:text-gray-300 transition-colors">
                                                                <span className="font-medium">{g}</span>
                                                                {!defaultGenres.includes(g) && (
                                                                    <button type="button" onClick={(e) => { e.stopPropagation(); setAvailableGenres(availableGenres.filter(ag => ag !== g)); if (bookForm.genre === g) setBookForm({ ...bookForm, genre: '' }); }} className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-md transition-colors" title="Delete custom genre">
                                                                        <X className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Stock *</label>
                                            <input required type="number" min="1" name="totalCopies" value={bookForm.totalCopies} onChange={handleBookInputChange} className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-gray-900 dark:text-white transition-all text-lg" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Asset Price (₱)</label>
                                            <input required type="number" min="0" name="price" value={bookForm.price} onChange={handleBookInputChange} className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-gray-900 dark:text-white transition-all text-lg" />
                                        </div>
                                    </div>
                                    {/* === RESTORED FIELDS === */}
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/40 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 transition-colors">
                                        <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Shelf Location *</label><input required type="text" name="shelfLocation" placeholder="e.g. A1-Fiction" value={bookForm.shelfLocation} onChange={handleBookInputChange} className="w-full px-4 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-gray-900 dark:text-white transition-all text-sm" /></div>
                                        <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Published Year *</label><input required type="number" name="publicationYear" placeholder="YYYY" value={bookForm.publicationYear} onChange={handleBookInputChange} className="w-full px-4 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-gray-900 dark:text-white transition-all text-sm" /></div>
                                        <div className="col-span-2"><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ISBN Number</label><input type="text" name="isbn" placeholder="Optional" value={bookForm.isbn} onChange={handleBookInputChange} className="w-full px-4 py-2.5 bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-gray-900 dark:text-white transition-all text-sm" /></div>
                                    </div>
                                    <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description</label><textarea name="description" rows="3" value={bookForm.description} onChange={handleBookInputChange} className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-gray-900 dark:text-white transition-all text-sm"></textarea></div>
                                </div>
                                <div className="flex flex-col h-full">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Digital Cover Asset</label>
                                    <div className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group min-h-[300px]">
                                        {previewImage ? <img src={previewImage} alt="Preview" className="h-full w-full object-cover" /> : <div className="text-center p-6"><Upload className="mx-auto h-12 w-12 text-gray-400 mb-3 group-hover:text-blue-600 transition-colors" /><p className="text-gray-500 font-bold">Click to inject asset</p></div>}
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required={editingBookId === 'new'} />
                                    </div>
                                    <div className="mt-6 flex gap-4">
                                        <button type="button" onClick={() => { setEditingBookId(null); setPreviewImage(null); }} className="w-1/3 py-5 rounded-2xl text-gray-700 dark:text-gray-300 font-bold text-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95">Cancel</button>
                                        <button type="submit" disabled={isCataloging} className={`w-2/3 py-5 rounded-2xl text-white font-bold text-xl shadow-xl transition-all ${isCataloging ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}`}>{isCataloging ? 'Processing...' : (editingBookId === 'new' ? 'Register Asset' : 'Save Changes')}</button>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* 2. DOSSIER MODAL */}
                {selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" onClick={() => setSelectedUser(null)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
                        <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden w-full max-w-lg relative z-10 p-10 border border-gray-100 dark:border-gray-800">
                            <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-500 rounded-full transition-colors"><XCircle className="h-6 w-6" /></button>
                            <div className="text-center mb-8">
                                <div className="mx-auto bg-gray-100 dark:bg-gray-800 h-24 w-24 rounded-full flex items-center justify-center mb-5"><User className="h-12 w-12 text-gray-600 dark:text-gray-300" /></div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{selectedUser.lastName}, {selectedUser.firstName}</h2>
                                <p className="text-gray-500 dark:text-gray-400 font-bold tracking-wide mt-2">{selectedUser.classification} • {selectedUser.gender} • {selectedUser.age || 'N/A'} yrs</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-5 mb-8">
                                <div className="flex items-start gap-4"><MapPin className="h-6 w-6 text-blue-500" /><p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{selectedUser.address || "Missing"}</p></div>
                                <div className="flex items-center gap-4"><Phone className="h-6 w-6 text-green-500" /><p className="text-gray-700 dark:text-gray-300 font-bold tracking-wide">{selectedUser.contactNumber || "Missing"}</p></div>
                            </div>
                            <button onClick={() => handleBlacklistToggle(selectedUser._id)} disabled={isBlacklisting} className={`w-full py-5 rounded-2xl font-black tracking-wide flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${selectedUser.isActive ? 'bg-red-600 hover:bg-red-700 text-white hover:shadow-red-600/30' : 'bg-gray-900 dark:bg-white dark:text-gray-900 text-white'}`}><Skull className="h-6 w-6" /> {selectedUser.isActive ? 'BLACKLIST USER' : 'RESTORE ACCESS'}</button>
                        </motion.div>
                    </div>
                )}

                {/* 3. CREATE STAFF MODAL */}
                {showStaffModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" onClick={() => setShowStaffModal(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
                        <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden w-full max-w-2xl relative z-10 p-10 border border-gray-100 dark:border-gray-800">
                            <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3"><UserPlus className="h-8 w-8 text-blue-600"/> Create Staff Account</h2><button onClick={() => setShowStaffModal(false)} className="text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full transition-colors"><XCircle className="h-8 w-8" /></button></div>
                            <form onSubmit={handleCreateStaff} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">First Name</label><input required type="text" value={staffForm.firstName} onChange={(e) => { const val = e.target.value; if (val === '' || /^[a-zA-Z\sñÑ-]*$/.test(val)) setStaffForm({...staffForm, firstName: val}); }} className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-gray-900 dark:text-white transition-all" /></div>
                                <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Last Name</label><input required type="text" value={staffForm.lastName} onChange={(e) => { const val = e.target.value; if (val === '' || /^[a-zA-Z\sñÑ-]*$/.test(val)) setStaffForm({...staffForm, lastName: val}); }} className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-gray-900 dark:text-white transition-all" /></div>
                                <div className="md:col-span-2"><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Official Email</label><input required type="email" value={staffForm.email} onChange={(e) => setStaffForm({...staffForm, email: e.target.value})} className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-gray-900 dark:text-white transition-all" /></div>
                                <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Clearance Level</label><select value={staffForm.role} onChange={(e) => setStaffForm({...staffForm, role: e.target.value})} className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-gray-900 dark:text-white cursor-pointer"><option value="LIBRARIAN">Librarian (Operations)</option><option value="ADMIN">Master Admin (Full Access)</option></select></div>
                                <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Secure Password</label><input required type="password" minLength="8" value={staffForm.password} onChange={(e) => setStaffForm({...staffForm, password: e.target.value})} className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-gray-900 dark:text-white transition-all" /></div>
                                <button type="submit" disabled={isCreatingStaff} className={`md:col-span-2 mt-4 w-full py-5 rounded-2xl text-white font-black tracking-wide text-xl shadow-xl transition-all ${isCreatingStaff ? 'bg-gray-400' : 'bg-gray-900 dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-700 active:scale-95'}`}>Register Staff</button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* 4. SCAN SUCCESS MODAL (VERIFICATION) */}
                {scanResult && !pendingVerification && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" className="absolute inset-0 bg-green-900/40 backdrop-blur-md" />
                        <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white dark:bg-gray-900 border-2 border-green-500 rounded-[3rem] shadow-2xl overflow-hidden w-full max-w-md relative z-10 p-12 text-center">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ type: "spring", damping: 15, stiffness: 200 }} className="mx-auto bg-green-100 dark:bg-green-900/50 h-32 w-32 rounded-full flex items-center justify-center mb-6"><CheckCircle className="h-16 w-16 text-green-500 mx-auto" /></motion.div>
                            <h3 className="font-black text-gray-900 dark:text-white text-3xl mb-2 tracking-tight">Clearance Granted</h3>
                            <p className="text-green-600 dark:text-green-400 font-bold mb-8 text-lg">Assets Officially Released.</p>
                            <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 mb-8">
                                <p className="text-gray-900 dark:text-white font-black text-xl">{scanResult.borrower.lastName}, {scanResult.borrower.firstName}</p>
                                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-2">DUE: <span className="text-red-500">{new Date(scanResult.dueDate).toLocaleDateString()}</span></p>
                            </div>
                            <button onClick={() => setScanResult(null)} className="w-full py-5 bg-green-500 hover:bg-green-600 text-white font-black text-xl tracking-wide rounded-2xl shadow-xl hover:shadow-green-500/40 active:scale-95 transition-all">Scan Next Code</button>
                        </motion.div>
                    </div>
                )}

                {/* 5. MULTI-ASSET CONFIRMATION MODAL (VERIFICATION) */}
                {pendingVerification && pendingVerification.length > 0 && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" onClick={() => setPendingVerification(null)} className="absolute inset-0 bg-gray-900/70 backdrop-blur-lg" />
                        <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden w-full max-w-4xl relative z-10 p-0 border border-gray-100 dark:border-gray-800">
                            <div className="bg-blue-600 p-8 flex items-center justify-between text-white">
                                <div><h3 className="font-black text-2xl flex items-center gap-3"><ShieldCheck className="h-8 w-8 text-blue-200" /> Physical ID Check Required</h3><p className="text-blue-200 font-medium mt-1">Verify the student's physical ID matches the dossier below.</p></div>
                                <span className="bg-white/20 backdrop-blur-md px-6 py-2.5 rounded-2xl font-black text-2xl tracking-[0.2em] shadow-inner">{reservationCode}</span>
                            </div>
                            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="bg-gray-50 dark:bg-gray-950 p-8 rounded-3xl border border-gray-200 dark:border-gray-800">
                                    <p className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Borrower Dossier</p>
                                    <div className="space-y-6">
                                        <div><p className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{pendingVerification[0].user.lastName}, {pendingVerification[0].user.firstName}</p><p className="font-bold text-gray-500 mt-2">{pendingVerification[0].user.classification} • {pendingVerification[0].user.gender} • {pendingVerification[0].user.age} yrs</p></div>
                                        <div className="flex items-start gap-4"><MapPin className="h-6 w-6 text-gray-400 mt-0.5" /><p className="text-gray-700 dark:text-gray-300 font-medium">{pendingVerification[0].user.address || "N/A"}</p></div>
                                        <div className="flex items-center gap-4"><Phone className="h-6 w-6 text-gray-400" /><p className="text-gray-700 dark:text-gray-300 font-bold tracking-wide">{pendingVerification[0].user.contactNumber || "N/A"}</p></div>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Requested Assets ({pendingVerification.length})</p>
                                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                                        {pendingVerification.map((tx, index) => (
                                            <div key={index} className="flex items-center gap-5 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                                <img src={tx.book.coverImageUrl} alt="Cover" className="w-14 h-20 object-cover rounded-xl shadow-sm" />
                                                <div><h4 className="font-bold text-gray-900 dark:text-white leading-tight mb-2">{tx.book.title}</h4><div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs font-black"><MapPin className="h-4 w-4" /> Shelf: {tx.book.shelfLocation}</div></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/50 flex items-center justify-between"><span className="font-bold text-blue-800 dark:text-blue-300">Requested Duration:</span><span className="font-black text-2xl text-blue-600 dark:text-blue-400">{pendingVerification[0].requestedDays} Days</span></div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-950 p-8 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-5">
                                <button onClick={() => setPendingVerification(null)} className="px-8 py-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel Request</button>
                                <button onClick={handleConfirmRelease} className="px-10 py-4 bg-blue-600 text-white font-black text-lg tracking-wide rounded-2xl hover:bg-blue-700 shadow-xl hover:shadow-blue-600/30 active:scale-95 transition-all">Confirm ID & Release All</button>
                            </div>
                        </motion.div>
                    </div>
                )}
                {/* 6. RETURN CONDITION MODAL */}
                {returnTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" onClick={() => setReturnTarget(null)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
                        <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden w-full max-w-md relative z-10 p-10 border border-gray-100 dark:border-gray-800 text-center">
                            <button onClick={() => setReturnTarget(null)} className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-500 rounded-full transition-colors"><XCircle className="h-6 w-6" /></button>
                            <div className="mx-auto bg-blue-50 dark:bg-blue-900/30 h-20 w-20 rounded-full flex items-center justify-center mb-6"><ArrowLeftRight className="h-10 w-10 text-blue-600 dark:text-blue-400" /></div>
                            <h3 className="font-black text-gray-900 dark:text-white text-2xl mb-2">Process Asset Return</h3>
                            <p className="text-gray-500 dark:text-gray-400 font-bold mb-6">{returnTarget.bookTitle}</p>
                            
                            <div className="text-left mb-8">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Physical Condition Assessment</label>
                                <select value={returnCondition} onChange={(e) => setReturnCondition(e.target.value)} className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none text-gray-900 dark:text-white cursor-pointer font-medium text-lg">
                                    <option value="Excellent">Excellent</option>
                                    <option value="Good">Good (Normal Wear)</option>
                                    <option value="Fair">Fair</option>
                                    <option value="Damaged">Damaged</option>
                                    <option value="Lost">Lost / Unreturned</option>
                                </select>
                                {returnCondition === 'Lost' && (
                                    <p className="mt-4 text-sm font-bold text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">⚠️ WARNING: Marking as Lost will bill the student for the full replacement cost of the asset and permanently remove it from active inventory.</p>
                                )}
                            </div>
                            
                            <button onClick={executeReturn} disabled={isLoadingReturns} className={`w-full py-5 text-white font-black text-xl tracking-wide rounded-2xl shadow-xl active:scale-95 transition-all ${returnCondition === 'Lost' ? 'bg-red-600 hover:bg-red-700 hover:shadow-red-600/30' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/30'}`}>
                                {returnCondition === 'Lost' ? 'Charge Replacement Fee' : 'Confirm Return'}
                            </button>
                        </motion.div>
                    </div>
                )}

                {/* 7. GLOBAL ACTION CONFIRMATION MODAL */}
                {confirmDialog.isOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div variants={backdropVariants} initial="hidden" animate="visible" exit="exit" onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
                        <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl overflow-hidden w-full max-w-sm relative z-10 p-8 border border-gray-100 dark:border-gray-800 text-center">
                            <div className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-6 ${confirmDialog.type === 'danger' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-green-100 dark:bg-green-900/30 text-green-600'}`}>
                                <AlertCircle className="h-10 w-10" />
                            </div>
                            <h3 className="font-black text-gray-900 dark:text-white text-2xl mb-3">{confirmDialog.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 font-medium mb-8 leading-relaxed">{confirmDialog.message}</p>
                            <div className="flex gap-4">
                                <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95">Cancel</button>
                                <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, isOpen: false }); }} className={`flex-1 py-4 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 ${confirmDialog.type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30' : 'bg-green-600 hover:bg-green-700 shadow-green-600/30'}`}>Confirm</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StaffDashboard;