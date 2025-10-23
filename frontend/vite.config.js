// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Em dev é mais seguro usar '/' como base. Se você realmente precisa que o app
  // seja servido em /app/ (ex: deploy em subpath), altere para base: '/app/'.
  base: '/',
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
      '/socket.io': {
        target: 'ws://localhost:3000',
        ws: true
      }
    }
  }
})
