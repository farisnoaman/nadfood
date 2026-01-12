import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: './',
  base: '/',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  build: {
    // Enable tree shaking
    rollupOptions: {
      treeshake: true,
      output: {
        // Optimize chunk file names for caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: (id) => {
          // Split React libraries individually for better tree shaking
          if (id.includes('node_modules/react')) {
            return 'react-core';
          }
          if (id.includes('node_modules/react-dom')) {
            return 'react-dom';
          }
          if (id.includes('node_modules/scheduler')) {
            return 'react-scheduler';
          }

          // Split React Router components
          if (id.includes('node_modules/react-router')) {
            return 'router-vendor';
          }

          // UI libraries - split icons separately
          if (id.includes('node_modules/lucide-react')) {
            return 'icons-vendor';
          }

          // State management and utilities
          if (id.includes('node_modules/@reduxjs') || id.includes('node_modules/redux')) {
            return 'state-vendor';
          }

          // Database & API - only load when needed
          if (id.includes('node_modules/@supabase/supabase-js')) {
            return 'supabase-vendor';
          }

          // Form libraries
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/@hookform')) {
            return 'forms-vendor';
          }

          // Date and utility libraries
          if (id.includes('node_modules/date-fns') || id.includes('node_modules/lodash')) {
            return 'utils-vendor';
          }

          // PDF generation - keep lazy loaded
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
            return 'pdf-vendor';
          }

          // Large UI libraries
          if (id.includes('node_modules/@headlessui') || id.includes('node_modules/@heroicons')) {
            return 'ui-vendor';
          }

          // Feature modules - split by role and make them load on demand
          if (id.includes('/components/features/admin/')) {
            return 'admin-features';
          }
          if (id.includes('/components/features/fleet/')) {
            return 'fleet-features';
          }
          if (id.includes('/components/features/accountant/')) {
            return 'accountant-features';
          }
          if (id.includes('/components/features/auth/')) {
            return 'auth-features';
          }
          if (id.includes('/components/features/platform/')) {
            return 'platform-features';
          }

          // Layout and providers - critical path, keep small
          if (id.includes('/components/layout/Layout') || id.includes('/providers/AppContext')) {
            return 'core-layout';
          }

          // Common UI components - split non-critical ones
          if (id.includes('/components/common/')) {
            return 'common-ui';
          }

          // Icons component
          if (id.includes('/components/Icons.tsx')) {
            return 'icons';
          }

          // Core utilities - keep essential ones in main bundle
          if (id.includes('/utils/') && !id.includes('/utils/print.ts') && !id.includes('/utils/logger')) {
            return 'core-utils';
          }

          // Logger and other utilities that might be used everywhere
          if (id.includes('/utils/logger')) {
            return 'logger';
          }

          // Print utilities (lazy loaded)
          if (id.includes('/utils/print.ts')) {
            return 'print-utils';
          }

          // Types and constants
          if (id.includes('/types/') || id.includes('/constants/')) {
            return 'types-constants';
          }
        }
      }
    },
    chunkSizeWarningLimit: 500, // Lower threshold for better splitting
    // Enable source maps for debugging
    sourcemap: false, // Disable for production to reduce bundle size
    // Enable minification with aggressive settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console statements
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
        passes: 2, // Multiple passes for better compression
      },
      mangle: {
        safari10: true, // Fix Safari 10/11 bugs
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Target modern browsers for better optimization
    target: 'esnext',
  }
});
