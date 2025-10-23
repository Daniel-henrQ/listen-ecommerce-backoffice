// storefront/vite.config.js (opcional — se não existir, pode usar o padrão)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // alterar para '/app/' se for necessário no deploy
  server: {
    port: 5173
  }
})
