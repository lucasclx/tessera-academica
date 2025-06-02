import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Adicione esta linha para definir 'global' como 'window'
    // para bibliotecas que esperam 'global' no ambiente do navegador.
    global: 'window', // Ou você pode tentar 'globalThis'
  },
  // Se você tiver outras configurações, como server.hmr.overlay, elas permanecem.
  // server: {
  //   hmr: {
  //     overlay: false, // Exemplo de outra configuração
  //   },
  // },
})