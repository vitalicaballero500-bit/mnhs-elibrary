import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import StaffDashboard from './pages/StaffDashboard';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import MemberDashboard from './pages/MemberDashboard'; // <-- THE FIX: Import the new dashboard
import ProtectedRoute from './components/ProtectedRoute';
import { useEffect } from 'react';
import useAuthStore from './store/useAuthStore'; // <-- THE ELITE FIX: IGNITION WIRE INJECTED

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  // === THE ELITE FIX: TRIGGER SILENT PING ON BOOT ===
  const { verifyAuth } = useAuthStore();
  useEffect(() => {
      verifyAuth();
  }, []); // Runs exactly once when the app starts

  return (
    // ... your existing JSX ...
    <div className={isAuthPage ? "h-screen w-screen overflow-hidden bg-gray-900" : "min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans pb-12 transition-colors duration-300"}>
      {!isAuthPage && <Navbar />}
      <div className={isAuthPage ? "h-full w-full" : "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"}>
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          
          {/* === THE FIX: NEW MEMBER ROUTE === */}
          <Route path="/member-dashboard" element={<ProtectedRoute allowedRoles={['MEMBER']}><MemberDashboard /></ProtectedRoute>} />
          
          <Route path="/staff-dashboard" element={<ProtectedRoute allowedRoles={['ADMIN', 'LIBRARIAN']}><StaffDashboard /></ProtectedRoute>} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
      <Toaster position="top-center" reverseOrder={false} toastOptions={{ duration: 4000, style: { borderRadius: '12px', background: '#333', color: '#fff' } }} />
    </Router>
  );
}

export default App;