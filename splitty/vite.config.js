import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages repo adınıza göre base path'i ayarlayın
  // Örnek: repo adınız "splitty" ise → base: '/splitty/'
  // Eğer username.github.io repo'suna deploy ediyorsanız → base: '/'
  base: '/splitty/',
})
