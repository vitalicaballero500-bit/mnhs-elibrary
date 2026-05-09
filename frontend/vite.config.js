import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa' // <-- ELITE UPGRADE: PWA Compiler

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // === ELITE UPGRADE: NATIVE APP MANIFEST ===
    VitePWA({
      registerType: 'autoUpdate', // Automatically updates the app when you deploy new code
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      // === THE FIX: STRICT API BYPASS ===
      // Prevents the offline Service Worker from swallowing backend API requests
      workbox: {
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [{
          urlPattern: /^\/api\//,
          handler: 'NetworkOnly',
        }]
      },
      manifest: {
        name: 'E-LEND Municipal Vault',
        short_name: 'E-LEND',
        description: 'Secure Library Management System',
        theme_color: '#2563eb', // Matches your blue branding
        background_color: '#030712', // Matches your dark mode background
        display: 'standalone', // Removes the browser URL bar
        orientation: 'portrait',
        icons: [
          {
            src: '/vite.svg', // In production, replace this with a real 192x192 logo
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/vite.svg', // In production, replace this with a real 512x512 logo
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173, // Enforces the exact port our Backend CORS expects
    proxy: {
      '/api': {
        // === THE FIX: STRICT IPv4 ROUTING ===
        // Forces Vite to bypass IPv6 'localhost' resolution and directly hit the IPv4 loopback
        target: 'http://127.0.0.1:5000', 
        changeOrigin: true,
      }
    }
  }
})