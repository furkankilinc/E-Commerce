import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
    plugins: [react() as any, tailwindcss() as any],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        dedupe: ['react', 'react-dom'],
    },
    server: {
        port: 5175,
        host: true,
        watch: {
            usePolling: true
        },
        allowedHosts: ['fuira.shop', '.fuira.shop', 'fuira.com', '.fuira.com', 'localhost'],
        proxy: {
            '/api': {
                target: 'http://api-gateway:80',
                changeOrigin: true,
            },
            '/products-images': {
                target: 'http://api-gateway:80',
                changeOrigin: true,
            },
        },
    },
    build: {
        minify: 'terser',
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    'router-vendor': ['react-router-dom'],
                    'ui-vendor': ['react-toastify', 'sweetalert2'],
                },
            },
        },
        chunkSizeWarningLimit: 600,
        cssMinify: true,
        sourcemap: false,
    },
})
