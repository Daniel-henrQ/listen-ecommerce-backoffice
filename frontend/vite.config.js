// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
    // Qualquer pedido que comece com /api será redirecionado
    '/api': 'http://localhost:3000',
    // Mantém o proxy para os uploads de imagens
    '/uploads': 'http://localhost:3000',
    // Mantém o proxy para as notificações em tempo real
    '/socket.io': {
      target: 'ws://localhost:3000',
      ws: true
      },
    },
  },
})