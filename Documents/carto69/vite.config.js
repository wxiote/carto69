import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true
  },
  build: {
    rollupOptions: {
      external: [
        'mapbox-gl/dist/mapbox-gl.css'
      ]
    }
  }
})
