import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  build: {
    outDir: 'dist',
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production', // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.debug', 'console.trace']
      }
    },
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        manualChunks: {
          // Vendor chunk: Core dependencies that rarely change
          'vendor': [
            'backbone',
            'backbone.marionette',
            'jquery',
            'lodash',
            'underscore'
          ],
          // Capacitor chunk: Native platform integrations
          'capacitor': [
            '@capacitor/core',
            '@capacitor/app',
            '@capacitor/haptics',
            '@capacitor/share',
            '@capacitor/browser',
            '@capacitor/device',
            '@capacitor/preferences',
            '@capacitor/status-bar'
          ]
          // Note: Services and providers are now dynamically imported,
          // so Vite will automatically create chunks for them
        }
      }
    },
    chunkSizeWarningLimit: 500 // Warn if chunk > 500KB
  },
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
