// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Caminho base para assets em produção E desenvolvimento
  base: '/app/',
  server: {
    // --- DEFINIR PORTA DIFERENTE ---
    port: 5174,
    // -----------------------------
    proxy: {
      // Proxy para a API (mantido)
      '/api': 'http://localhost:3000',
      // Proxy para uploads (mantido)
      '/uploads': 'http://localhost:3000',
      // Proxy para WebSocket (mantido)
      '/socket.io': {
        target: 'ws://localhost:3000',
        ws: true
      },
    },
  },
})