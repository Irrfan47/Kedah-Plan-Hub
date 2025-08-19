import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';
  const timestamp = Date.now();

  return {
    base: '/', // For root domain hosting
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'lucide-react',
        'clsx',
        'tailwind-merge'
      ],
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      open: false, // Don't auto-open browser in production
    },
    build: {
      outDir: 'dist',
      sourcemap: false, // Disable sourcemaps in production
      chunkSizeWarningLimit: 1000,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.log in production
          drop_debugger: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-toast', '@radix-ui/react-tooltip'],
            'icons-vendor': ['lucide-react'],
            'utils-vendor': ['clsx', 'tailwind-merge'],
            'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'query-vendor': ['@tanstack/react-query'],
          },
          entryFileNames: `assets/[name]-${timestamp}-[hash].js`,
          chunkFileNames: `assets/[name]-${timestamp}-[hash].js`,
          assetFileNames: `assets/[name]-${timestamp}-[hash].[ext]`
        },
      },
    },
  };
});