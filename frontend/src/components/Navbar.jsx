import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, ShoppingCart, LogOut, User as UserIcon, Menu, X, Shield, GraduationCap } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useCartStore from '../store/useCartStore';

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuthStore();
    const { cart } = useCartStore();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <nav className="bg-[#FCFBF8]/90 dark:bg-[#0A0506]/90 backdrop-blur-lg shadow-sm border-b border-gray-200/60 dark:border-rose-950/30 sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20"> {/* Slightly taller for the crest */}
                    <div className="flex items-center">
                        <Link to={user?.role === 'MEMBER' ? '/' : '/staff-dashboard'} className="flex items-center gap-3 group">
                            {/* MNHS Academic Crest */}
                            <div className="relative h-10 w-10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                <Shield className="absolute inset-0 h-10 w-10 text-rose-800 dark:text-rose-700" strokeWidth={1.5} />
                                <GraduationCap className="h-5 w-5 text-amber-500 z-10 relative bottom-0.5" strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="font-black text-xl leading-none tracking-tight text-gray-900 dark:text-white uppercase">MNHS <span className="text-rose-800 dark:text-rose-500">E-LIBRARY</span></span>
                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase mt-0.5">Mangaldan National HS</span>
                            </div>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-8">
                        
                        {/* ONLY SHOW PUBLIC LINKS TO STANDARD MEMBERS */}
                        {user?.role === 'MEMBER' && (
                            <>
                                <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-rose-800 dark:hover:text-rose-500 font-medium transition-colors">Catalog</Link>
                                <Link to="/cart" className="relative text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors flex items-center">
                                    <ShoppingCart className="h-6 w-6" />
                                    {cart.length > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-amber-400 text-rose-950 text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-[#FCFBF8] dark:border-gray-950 shadow-sm transition-colors">
                                            {cart.length}
                                        </span>
                                    )}
                                </Link>
                            </>
                        )}

                        {/* UNIVERSAL PROFILE & LOGOUT */}
                        {isAuthenticated ? (
                            <div className="flex items-center gap-4 border-l border-gray-200/60 dark:border-gray-800 pl-4 ml-2">
                                
                                {/* === THE FIX: SMART ROUTING PROFILE PILL === */}
                                <Link 
                                    to={user?.role === 'MEMBER' ? '/member-dashboard' : '/staff-dashboard'} 
                                    className="flex items-center gap-2 bg-white dark:bg-[#0F0809] px-3 py-1.5 rounded-full border border-gray-200/60 dark:border-rose-900/30 hover:border-amber-400/50 transition-colors cursor-pointer shadow-sm group"
                                    title="Go to Command Center"
                                >
                                    <UserIcon className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{user.firstName}</span>
                                    <span className="text-[10px] uppercase tracking-wider font-black text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/50">
                                        {user.role}
                                    </span>
                                </Link>

                                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-rose-800 dark:hover:text-rose-500 font-bold transition-colors">Sign In</Link>
                                <Link to="/register" className="bg-rose-800 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-rose-900 shadow-[0_4px_15px_rgba(159,18,57,0.3)] border border-rose-700 active:scale-95 transition-all">
                                    Join MNHS Vault
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-600 dark:text-gray-300 hover:text-blue-600">
                            {isMobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 px-4 py-4 space-y-4 shadow-lg absolute w-full transition-colors duration-300">
                    {user?.role === 'MEMBER' && (
                        <>
                            <Link to="/" className="block text-gray-700 dark:text-gray-300 font-medium" onClick={() => setIsMobileMenuOpen(false)}>Catalog</Link>
                            <Link to="/cart" className="block text-gray-700 dark:text-gray-300 font-medium flex justify-between" onClick={() => setIsMobileMenuOpen(false)}>
                                Cart <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 py-0.5 px-2 rounded-full text-sm font-bold">{cart.length} items</span>
                            </Link>
                            <Link to="/member-dashboard" className="block text-blue-600 dark:text-blue-400 font-medium" onClick={() => setIsMobileMenuOpen(false)}>My Dashboard</Link>
                        </>
                    )}
                    
                    {isAuthenticated ? (
                        <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="block w-full text-left text-red-600 font-medium">Log Out</button>
                    ) : (
                        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                            <Link to="/login" className="block w-full text-center border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl font-bold" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
                            <Link to="/register" className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-xl font-bold" onClick={() => setIsMobileMenuOpen(false)}>Join Library</Link>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;