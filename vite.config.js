import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // IMPORTANT: set this to your GitHub repo name
  // e.g. if your URL is https://username.github.io/brasileirao-draft/ use '/brasileirao-draft/'
  base: '/brasileirao-draft/',
})
