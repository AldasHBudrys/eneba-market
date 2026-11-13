import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Dev only: forward /api to Laravel, same as the Vercel rewrite does in production.
  server: { proxy: { '/api': 'http://localhost:8000' } },
})
