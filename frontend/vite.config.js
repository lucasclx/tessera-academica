import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Definir global para compatibilidade com bibliotecas Node.js
    global: 'window',
  },
  optimizeDeps: {
    include: ['sockjs-client']
  },
  server: {
    port: 5173,
    host: true
  }
})