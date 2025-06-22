import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/cromestesia/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
    open: true
  }
})
