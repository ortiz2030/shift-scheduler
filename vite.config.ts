import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy': "script-src 'self' 'unsafe-eval' 'unsafe-inline';"
    }
  },
  optimizeDeps: {
    exclude: ['sql.js']
  },
  build: {
    rollupOptions: {
      external: ['sql.js']
    }
  }
}) 