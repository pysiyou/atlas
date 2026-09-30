import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            if (id.includes('framer-motion') || id.includes('@floating-ui')) {
              return 'ui';
            }
            if (id.includes('react-hook-form') || id.includes('zod')) {
              return 'forms';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false, // Disable in production for smaller builds
  },
})
