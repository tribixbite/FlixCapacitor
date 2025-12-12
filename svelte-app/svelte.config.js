import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    runes: true
  },
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: true
    }),
    alias: {
      '$components': 'src/lib/components',
      '$stores': 'src/lib/stores',
      '$services': 'src/lib/services',
      '$plugins': 'src/lib/plugins',
      '$utils': 'src/lib/utils',
      '$types': 'src/lib/types',
      '$config': 'src/lib/config'
    }
  }
};

export default config;
