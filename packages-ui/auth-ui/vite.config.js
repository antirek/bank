import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    host: process.env.DEV_SERVER_HOST || true,
    port: 5174,
    proxy: {
      '/public-config.json': {
        target: 'http://localhost:3102',
        changeOrigin: true
      },
      '/auth-api': {
        target: 'http://localhost:3102',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/auth-api/, '')
      }
    }
  }
});
