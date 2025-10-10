import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        'dist/',
        'android/',
        '*.config.js',
        'mock-streaming-server.js'
      ]
    },
    include: ['test/**/*.test.js'],
    testTimeout: 10000
  }
});
