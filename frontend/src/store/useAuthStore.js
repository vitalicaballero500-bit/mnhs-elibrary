import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/axios';
import toast from 'react-hot-toast';

const useAuthStore = create(
    persist(
        (set) => ({
            user: null, 
            isAuthenticated: false,
            isLoading: false,

            login: async (email, password) => {
                set({ isLoading: true });
                try {
                    const response = await api.post('/auth/login', { email, password });
                    set({ 
                        user: response.data, 
                        isAuthenticated: true, 
                        isLoading: false 
                    });
                    toast.success(`Welcome back, ${response.data.firstName}!`);
                    return true; 
                } catch (error) {
                    set({ isLoading: false });
                    toast.error(error.response?.data?.message || 'Login failed. Check credentials.');
                    return false;
                }
            },

            logout: async () => {
                try {
                    await api.post('/auth/logout');
                    set({ user: null, isAuthenticated: false });
                    toast.success('Securely logged out.');
                } catch (error) {
                    toast.error('Error during logout.');
                }
            }, // <-- MAKE SURE THERE IS A COMMA HERE

            // === THE ELITE FIX: SILENT VERIFICATION PING ===
            verifyAuth: async () => {
                try {
                    const response = await api.get('/auth/verify');
                    // The backend confirms the true identity. Force overwrite the local state to match reality.
                    set({ user: response.data, isAuthenticated: true });
                    return true;
                } catch (error) {
                    // The backend rejected the cookie (expired or missing). Purge the fake local state instantly.
                    set({ user: null, isAuthenticated: false });
                    return false;
                }
            }
        }),
        {
            name: 'lrbms-auth-storage' // This saves your session!
        }
    )
);

export default useAuthStore;