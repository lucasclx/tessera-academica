// vite.config.ts - Versão que funciona com dependências atuais
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { splitVendorChunkPlugin } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // React Fast Refresh
      fastRefresh: true,
    }),
    splitVendorChunkPlugin(),
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  build: {
    // Otimizações básicas
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'terser',
    
    rollupOptions: {
      output: {
        // Chunking strategy otimizada
        manualChunks: {
          // Vendor libraries principais
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@headlessui/react', '@heroicons/react'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'yup'],
          'query-vendor': ['@tanstack/react-query'],
          
          // Editor separado por ser grande
          'editor-vendor': ['@tiptap/react', '@tiptap/starter-kit'],
        }
      }
    },
    
    // Terser options para produção
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      }
    }
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom', 
      'react-router-dom',
      '@tanstack/react-query'
    ]
  },
  
  server: {
    host: true,
    port: 3000,
    // HMR otimizado
    hmr: {
      overlay: true
    }
  }
});