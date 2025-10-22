// storefront/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // --- ADICIONE ESTA SECÇÃO 'server' ---
  server: {
    proxy: {
      // Qualquer pedido que comece com '/api'
      // será redirecionado para o seu backend na porta 3000
      '/api': 'http://localhost:3000',
    }
  }
  // --- FIM DA SECÇÃO ADICIONADA ---
})