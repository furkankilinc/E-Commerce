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
    port: 5173,
    host: true,
    watch: {
        usePolling: true
    },
    allowedHosts: ['user.fuira.com'],
    proxy: {
      '/api': {
        target: 'http://node_storebackend:5000',
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
