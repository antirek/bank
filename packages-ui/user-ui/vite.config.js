import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: process.env.DEV_SERVER_HOST || true,
    port: 5173,
    proxy: {
      '/public-config.json': {
        target: 'http://localhost:3101',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:3101',
        changeOrigin: true
      },
      '/ws': {
        target: 'http://127.0.0.1:3103',
        ws: true,
        changeOrigin: true
      }
    }
  }
});
