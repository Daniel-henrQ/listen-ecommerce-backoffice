// storefront/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // <<< GARANTIR que base é '/' >>>
  base: '/',
  server: {
    port: 5173, // Porta diferente do backoffice
    // Adicionar proxy para /api e /uploads para desenvolvimento
    proxy: {
        '/api': 'http://localhost:3000',
        '/uploads': 'http://localhost:3000',
        // Vídeo e outros assets estáticos do storefront DEVEM estar na pasta 'public' do storefront
        // Proxy para WebSocket (se necessário para o storefront)
        '/socket.io': {
            target: 'ws://localhost:3000',
            ws: true
         }
    }
  }
})