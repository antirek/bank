import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');

  const appTitle = env.VITE_APP_TITLE || 'Boqq — чаты для бизнеса';
  const shortName = env.VITE_PWA_SHORT_NAME || 'Boqq Чаты';
  const themeColor = env.VITE_THEME_COLOR || '#5c6bc0';
  const bgColor = env.VITE_PWA_BACKGROUND_COLOR || '#f0f2f8';

  let base = env.VITE_BASE_PATH || '/';
  if (base !== '/' && !base.endsWith('/')) base = `${base}/`;

  return {
    base,
    plugins: [
      vue(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: 'auto',
        includeAssets: ['icon-pwa.svg', 'vite.svg'],
        manifest: {
          name: appTitle,
          short_name: shortName,
          description:
            env.VITE_PWA_DESCRIPTION || 'Чаты с клиентами для владельцев бизнеса',
          start_url: base,
          scope: base,
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui', 'browser'],
          orientation: 'portrait-primary',
          theme_color: themeColor,
          background_color: bgColor,
          lang: 'ru',
          icons: [
            {
              src: `${base}icon-pwa.svg`,
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,svg,png,webp,woff2}'],
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/runtime-config\.json$/],
          runtimeCaching: [
            {
              urlPattern: ({ url }) =>
                url.origin === self.location.origin && url.pathname.startsWith('/api'),
              handler: 'NetworkOnly'
            }
          ]
        },
        devOptions: {
          enabled: false
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      host: process.env.DEV_SERVER_HOST || true,
      port: 5175,
      fs: {
        allow: [path.resolve(__dirname, '..')]
      },
      proxy: {
        '/runtime-config.json': {
          target: 'http://127.0.0.1:3105',
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
  };
});
