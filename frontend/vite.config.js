// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // --- ADICIONE ESTA LINHA ---
  base: '/app/', // Informa ao Vite que a aplicação viverá sob /app
  // --------------------------
  server: {
    port: 5174, // Mantém a porta de desenvolvimento
    proxy: { // Mantém os proxies
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
      '/socket.io': {
        target: 'ws://localhost:3000',
        ws: true,
      },
    },
  },
})