import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// BASE_PATH is set in CI for GitHub Pages (e.g. /random-bible-verse/)
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
})
