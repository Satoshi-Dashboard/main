import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    watch: {
      ignored: [
        '**/bitnodes_cache.json',
        '**/btc_rates_cache.json',
        '**/btc_distribution_cache.json',
        '**/btc_addresses_richer_cache.json',
        '**/visitor_counter.json',
      ],
    },
    proxy: {
      '/api': {
        target: 'http://192.168.0.137:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ['recharts'],
          framer: ['framer-motion'],
        },
      },
    },
  },
})
