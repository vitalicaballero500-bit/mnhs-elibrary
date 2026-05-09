import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, User, Mail, Lock, MapPin, Phone, Calendar, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const Register = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', suffix: '', age: '', gender: 'Male', 
        address: '', contactNumber: '', email: '', password: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        // 1. Anti-Number Name Shield (Letters, spaces, hyphens only)
        if (['firstName', 'lastName', 'suffix'].includes(name)) {
            if (value !== '' && !/^[a-zA-Z\sñÑ-]*$/.test(value)) return;
        }

        // 2. Strict Phone Number Lock (Only numbers, max 11 digits)
        if (name === 'contactNumber') {
            if (value !== '' && !/^\d*$/.test(value)) return;
            if (value.length > 11) return;
        }

        // 3. Age Restrictor (Only numbers, max 3 digits)
        if (name === 'age') {
            if (value !== '' && !/^\d*$/.test(value)) return;
            if (value.length > 3) return;
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Final Frontend Submission Checks
        if (formData.contactNumber.length !== 11 || !formData.contactNumber.startsWith('09')) {
            return toast.error("Contact number must be exactly 11 digits and start with 09.");
        }
        if (Number(formData.age) < 5) {
            return toast.error("You must be at least 5 years old to register.");
        }

        setIsLoading(true);
        const loadingToast = toast.loading("Forging your library credentials...");

        try {
            // Send to the backend register route (which sets role to MEMBER automatically)
            await api.post('/auth/register', { ...formData, classification: 'STUDENT' });
            toast.success("Registration complete! Welcome to E-Lend.", { id: loadingToast });
            navigate('/login'); // Send them to login after successful registration
        } catch (error) {
            toast.error(error.response?.data?.message || "Registration failed.", { id: loadingToast });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // === THE FIX: SCROLLABLE WRAPPER & INTERNAL PADDING ===
        <div className="h-full w-full overflow-y-auto relative">
            
            {/* Background Image: Changed to 'fixed' so it stays put while scrolling */}
            <div 
                className="fixed inset-0 w-full h-full bg-cover bg-center z-0"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000&auto=format&fit=crop')` }}
            >
                <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"></div>
            </div>

            {/* The Scrollable Content Container */}
            <div className="relative z-10 min-h-full flex flex-col items-center justify-center py-12 px-4">
                
                {/* === NEW FEATURE: FLOATING NAVIGATION HEADER === */}
                <div className="w-full max-w-4xl mb-6 flex justify-between items-center">
                    <Link to="/login" className="inline-flex items-center gap-2 text-gray-300 hover:text-white font-bold bg-gray-800/50 px-5 py-2.5 rounded-xl backdrop-blur-md border border-gray-700 transition-all hover:bg-gray-700 active:scale-95 shadow-lg">
                        <ArrowLeft className="h-5 w-5" /> Back to Login
                    </Link>
                    
                    <Link to="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-bold bg-gray-800/50 px-5 py-2.5 rounded-xl backdrop-blur-md border border-blue-900/50 transition-all hover:bg-gray-800 active:scale-95 shadow-lg">
                        <BookOpen className="h-5 w-5" /> Public Catalog
                    </Link>
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                    
                    {/* Left Column: Branding */}
                    <div className="w-full md:w-5/12 bg-blue-600 p-10 text-white flex flex-col justify-center relative overflow-hidden hidden md:flex">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-10 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>
                        
                        <div className="relative z-10">
                            <BookOpen className="h-16 w-16 mb-6 text-blue-200" />
                            <h2 className="text-4xl font-black mb-4 leading-tight">Forging Your Identity.</h2>
                            <p className="text-blue-100 text-lg mb-8 opacity-90 leading-relaxed">Enter your physical credentials to securely connect to the municipal library vault.</p>
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-blue-200"><MapPin className="h-5 w-5" /> <span>Valid physical address required</span></div>
                                <div className="flex items-center gap-3 text-blue-200"><Phone className="h-5 w-5" /> <span>Active local contact required</span></div>
                                <div className="flex items-center gap-3 text-blue-200"><Lock className="h-5 w-5" /> <span>Strict KYC verification protocol</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: The Form */}
                    <div className="w-full md:w-7/12 p-8 sm:p-12">
                        <h3 className="text-2xl font-black text-white mb-2">Create Account</h3>
                        <p className="text-gray-400 mb-8">All fields are strictly required for security clearance.</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative"><User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" /><input required type="text" name="firstName" placeholder="First Name" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                                <div className="relative"><User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" /><input required type="text" name="lastName" placeholder="Last Name" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1 relative"><User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" /><input type="text" name="suffix" placeholder="Suffix (Jr)" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                                <div className="col-span-1 relative"><Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" /><input required type="number" min="5" name="age" placeholder="Age" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                                <div className="col-span-1">
                                    <select required name="gender" onChange={handleChange} className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
                                        <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="relative"><MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" /><input required type="text" name="address" placeholder="Full Physical Address" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                            
                            <div className="relative"><Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" /><input required type="text" pattern="09[0-9]{9}" name="contactNumber" placeholder="Mobile Number (09...)" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" title="Must be an 11-digit number starting with 09" /></div>
                            
                            <div className="relative"><Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" /><input required type="email" name="email" placeholder="Email Address" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                            
                            <div className="relative"><Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" /><input required type="password" minLength="8" name="password" placeholder="Secure Password" onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none" /></div>

                            <button type="submit" disabled={isLoading} className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95">
                                {isLoading ? 'Processing...' : 'Create Account'}
                            </button>
                        </form>

                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Register;