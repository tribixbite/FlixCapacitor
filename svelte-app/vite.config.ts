import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: 'esbuild'  // Ensure CSS is minified
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
