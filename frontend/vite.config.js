// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // <<< REMOVA OU COMENTE A LINHA ABAIXO PARA DESENVOLVIMENTO >>>
  //base: '/app/',
  server: {
    port: 5174, // Porta do backoffice
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