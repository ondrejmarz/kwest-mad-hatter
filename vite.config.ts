import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Build stamp used as the app version (shown on the entry screen so we can tell which build loaded).
// Computed once when the config is evaluated — i.e. at build time (or dev-server start) — in local
// time, formatted `YYYY.MM.DD.HHmm`, e.g. `2026.09.01.1454`.
const now = new Date();
const pad = (value: number): string => String(value).padStart(2, '0');
const appVersion = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}.${pad(now.getHours())}${pad(now.getMinutes())}`;

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    // Installable PWA (phase 8): a Workbox service worker precaches the app shell so it opens
    // offline and launches standalone (no browser chrome) once added to the home screen. The SW
    // updates itself in the background; game state stays live through Firestore, not the SW.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Kwest',
        short_name: 'Kwest',
        description: 'Táborová hra: úkoly, mince a odměny.',
        lang: 'cs',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f8fafc',
        // An installed Android WebAPK freezes `theme_color` at install time and paints the status
        // bar with it, ignoring runtime `<meta theme-color>` changes — which is why a light value
        // left the bar white in dark mode. Force it empty (vite-plugin-pwa would otherwise inject
        // its `#42b883` default) so the WebAPK falls back to the system-themed status bar, which
        // follows the OS light/dark preference on its own.
        theme_color: '',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        // The main JS chunk is ~1 MB; raise the precache ceiling so it is cached for offline use.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
});
