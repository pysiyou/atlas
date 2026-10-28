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
      // jspdf optionally imports html2canvas; Atlas only draws vector PDFs.
      html2canvas: path.resolve(__dirname, './src/lib/empty-html2canvas.ts'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Lab workflow modals are registered globally; keep them out of the main feature chunk.
          if (id.includes('/features/lab/workflow/modals/')) {
            return 'lab-workflow-modals';
          }
          if (id.includes('/features/lab/workflow/')) {
            return 'lab-workflow';
          }
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
            if (id.includes('jspdf')) {
              return 'jspdf';
            }
            if (id.includes('date-fns')) {
              return 'date-fns';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false, // Disable in production for smaller builds
  },
  optimizeDeps: {
    exclude: ['html2canvas'],
  },
})
