import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// host: true → bind 0.0.0.0 so phones/emulators on your LAN can hit the dev server
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
})
