// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // Corrigir erro "global is not defined"
    global: 'globalThis',
  },
  optimizeDeps: {
    include: [
      'react-icons/fa',
      '@heroicons/react/24/outline',
      '@headlessui/react',
      'katex',
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-text-style',
      '@tiptap/extension-font-family',
      '@tiptap/extension-highlight',
      '@tiptap/extension-underline',
    ]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          tiptap: [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-text-style',
            '@tiptap/extension-font-family'
          ]
        }
      }
    }
  }
})