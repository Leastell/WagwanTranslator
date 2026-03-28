import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// host: true → bind 0.0.0.0 so phones/emulators on your LAN can hit the dev server
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // Frontend uses /api/* → FastAPI on 8000 (see app/src/lib/api.js)
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  preview: {
    host: true,
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
