import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }

          // Routing
          if (id.includes('node_modules/react-router-dom')) {
            return 'router-vendor';
          }

           // UI libraries
           if (id.includes('node_modules/lucide-react')) {
             return 'react-vendor';
           }

          // Database & API
          if (id.includes('node_modules/@supabase/supabase-js')) {
            return 'supabase-vendor';
          }

          // PDF generation (heavy)
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
            return 'pdf-vendor';
          }

          // Feature modules
          if (id.includes('/components/features/admin/')) {
            return 'admin-features';
          }
          if (id.includes('/components/features/fleet/')) {
            return 'fleet-features';
          }
          if (id.includes('/components/features/accountant/')) {
            return 'accountant-features';
          }

            // Common components and Icons
           if (id.includes('/components/layout/') || id.includes('/providers/') || id.includes('/components/common/') || id.includes('/components/Icons.tsx')) {
             return 'react-vendor';
           }

           // Layout and providers
           if (id.includes('/components/layout/') || id.includes('/providers/')) {
             return 'react-vendor';
           }

           // Utilities
            if (id.includes('/utils/')) {
             return 'utils';
           }
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Increase from 500KB to 1000KB
  }
});
