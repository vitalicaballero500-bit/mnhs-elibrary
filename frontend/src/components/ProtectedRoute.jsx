import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, isAuthenticated, isLoading } = useAuthStore();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            toast.error("You must be logged in to view this page.");
        } else if (!isLoading && isAuthenticated && allowedRoles && !allowedRoles.includes(user?.role)) {
            toast.error("Access Denied: Strict Admin/Librarian clearance required.");
        }
    }, [isAuthenticated, isLoading, allowedRoles, user?.role]);

    if (isLoading) return <div className="text-center mt-20 text-gray-500 font-bold">Loading security clearance...</div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/" replace />;

    return children;
};

export default ProtectedRoute;