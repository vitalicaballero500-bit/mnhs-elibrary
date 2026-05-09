import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

const useCartStore = create(
    persist(
        (set, get) => ({
            cart: [], 

            addToCart: (book) => {
                const currentCart = get().cart;
                
                // === 🚨 THE F1 PATCH: INFINITE CART LOCKDOWN ===
                // Strictly enforces a 3-item limit to prevent DB overload
                if (currentCart.length >= 3) {
                    toast.error("Cart limit reached. Maximum 3 assets allowed.");
                    return;
                }

                // Prevent duplicate books
                const isAlreadyInCart = currentCart.some((item) => item._id === book._id);
                if (isAlreadyInCart) {
                    toast.error(`${book.title} is already in your cart.`);
                    return;
                }

                set({ cart: [...currentCart, book] });
                toast.success(`${book.title} added to cart.`);
            },

            removeFromCart: (bookId) => {
                set({ cart: get().cart.filter((item) => item._id !== bookId) });
            },

            clearCart: () => set({ cart: [] }),
        }),
        {
            name: 'lrbms-cart-storage', 
        }
    )
);

export default useCartStore;