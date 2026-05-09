import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, GraduationCap, Shield } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(email, password);
        
        if (success) {
            toast.success("Authentication successful.");
            
            // === NEW: SMART ROLE-BASED REDIRECT ===
            const currentUser = useAuthStore.getState().user;
            if (currentUser?.role === 'ADMIN' || currentUser?.role === 'LIBRARIAN') {
                navigate('/staff-dashboard'); // Staff go straight to the Sanctum
            } else {
                navigate('/'); // Members go to the Catalog
            }
        } else {
            toast.error("Invalid credentials.");
        }
    };

    return (
        <div className="h-full w-full flex items-center justify-center relative">
            
            {/* Background Image covering exactly 100% of the screen */}
            <div 
                className="absolute inset-0 w-full h-full bg-cover bg-center"
                style={{ backgroundImage: "url('/library.jpg')" }}
            />
            {/* Dark overlay to make text readable */}
            <div className="absolute inset-0 bg-gray-900/60 mix-blend-multiply" />

            {/* === NEW FEATURE: FLOATING ESCAPE HATCH === */}
            <div className="absolute top-6 right-6 sm:top-8 sm:right-10 z-20">
                <Link to="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-bold bg-gray-800/50 px-5 py-2.5 rounded-xl backdrop-blur-md border border-blue-900/50 transition-all hover:bg-gray-800 active:scale-95 shadow-lg">
                    <BookOpen className="h-5 w-5" /> Public Catalog
                </Link>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                className="relative z-10 w-full max-w-md p-6 sm:p-8"
            >
                <div className="backdrop-blur-xl bg-gray-900/60 border border-white/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                    {/* Gold Accent Line */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500" />
                    
                    <div className="text-center mb-8 mt-2">
                        {/* Custom MNHS Shield Logo */}
                        <div className="mx-auto relative h-20 w-20 flex items-center justify-center mb-5">
                            <Shield className="absolute inset-0 h-20 w-20 text-rose-800 drop-shadow-[0_0_15px_rgba(225,29,72,0.5)]" strokeWidth={1.5} />
                            <GraduationCap className="h-10 w-10 text-amber-400 z-10 relative bottom-1" strokeWidth={2} />
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tight uppercase">MNHS <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">E-LIBRARY</span></h1>
                        <p className="text-gray-300 mt-2 text-xs font-bold tracking-widest uppercase opacity-80">Mangaldan National High School</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input 
                                type="email" required placeholder="Email Address"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input 
                                type="password" required placeholder="Password"
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <button 
                            type="submit" disabled={isLoading}
                            className="w-full py-4 mt-4 bg-rose-800 hover:bg-rose-900 text-white font-black tracking-wide rounded-xl shadow-[0_4px_20px_rgba(159,18,57,0.4)] transition-all active:scale-95 border border-rose-700"
                        >
                            {isLoading ? 'Authenticating...' : 'ACCESS VAULT'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-300 text-sm">
                            Need an account? <Link to="/register" className="text-blue-400 font-bold hover:underline">Register Here</Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;