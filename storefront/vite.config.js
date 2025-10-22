// storefront/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // --- GARANTIR QUE A BASE É '/' ---
  base: '/',
  // ------------------------------
  server: {
    // A porta padrão 5173 será usada se não especificada
    // port: 5173, // Pode descomentar se quiser garantir
    proxy: {
      // Proxy para a API (mantido)
      '/api': 'http://localhost:3000',
       // Proxy para uploads (se o storefront precisar)
      '/uploads': 'http://localhost:3000',
       // Proxy para WebSocket (se o storefront precisar)
      '/socket.io': {
        target: 'ws://localhost:3000',
        ws: true
      },
    }
  }
})