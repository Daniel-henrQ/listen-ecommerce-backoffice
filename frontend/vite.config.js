// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // <<< MODIFICAÇÃO IMPORTANTE >>>
  // DESCOMENTE a linha `base: '/app/'` APENAS quando for fazer o BUILD para PRODUÇÃO.
  // MANTENHA COMENTADO para desenvolvimento local, para que o proxy funcione corretamente.
  // base: '/app/', // << Descomentar para build de produção
  server: {
    port: 5174, // Porta do backoffice (diferente do storefront e backend)
    proxy: {
      // Redireciona pedidos /api para o backend na porta 3000
      '/api': 'http://localhost:3000',
      // Redireciona pedidos /uploads para o backend na porta 3000
      '/uploads': 'http://localhost:3000',
      // Proxy para WebSocket (Socket.IO)
      '/socket.io': {
        target: 'ws://localhost:3000', // Aponta para o backend
        ws: true
      }
    }
  }
})