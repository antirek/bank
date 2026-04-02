import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
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
