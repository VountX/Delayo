import { resolve } from 'path';
import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

import manifest from './src/manifest';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    crx({
      manifest,
      contentScripts: {
        injectCss: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@utils': resolve(__dirname, './src/utils'),
      '@assets': resolve(__dirname, './src/assets'),
    },
  },
  build: {
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      // input: {
      //   popup: resolve(__dirname, 'popup.html'),
      //   options: resolve(__dirname, 'options.html'),
      //   background: resolve(__dirname, 'src/background/index.ts'),
      // },
      output: {
        manualChunks: undefined,
      }
    },
  },
  optimizeDeps: {
    exclude: ['moment']
  },
});