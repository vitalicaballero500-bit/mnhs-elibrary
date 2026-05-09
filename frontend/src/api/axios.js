import axios from 'axios';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';

// === 🚨 THE F1 PATCH: DYNAMIC CLOUD ROUTING ===
// When on Vercel, it uses VITE_API_URL. On localhost, it defaults to /api
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true 
});

// === ELITE POLISH: THE GHOST TOKEN INTERCEPTOR ===
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            
            const authState = useAuthStore.getState();
            
            if (authState.user) {
                console.warn("🚨 SECURITY PROTOCOL: Ghost Token Detected. Purging local state.");
                toast.error("Session Expired. Vault locked for your protection.");
                
                authState.logout(); 
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;