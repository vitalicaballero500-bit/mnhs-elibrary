import { create } from 'zustand';

const useThemeStore = create((set) => ({
    isDarkMode: localStorage.getItem('theme') === 'dark',
    toggleTheme: () => set((state) => {
        const newTheme = !state.isDarkMode ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        
        // This physically injects the 'dark' class into the HTML root
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        return { isDarkMode: !state.isDarkMode };
    }),
    initTheme: () => {
        // Run this on app load to apply saved theme
        if (localStorage.getItem('theme') === 'dark') {
            document.documentElement.classList.add('dark');
        }
    }
}));

export default useThemeStore;