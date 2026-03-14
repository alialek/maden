import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const isDevelopmentBuild = mode === 'development';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/webview'),
      },
    },
    build: {
      cssMinify: !isDevelopmentBuild,
      minify: isDevelopmentBuild ? false : 'esbuild',
      outDir: 'dist/webview',
      emptyOutDir: false,
      reportCompressedSize: !isDevelopmentBuild,
      sourcemap: isDevelopmentBuild,
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html'),
        output: {
          entryFileNames: 'main.js',
          chunkFileNames: isDevelopmentBuild
            ? 'chunks/[name].js'
            : 'chunks/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'index.css') {
              return 'main.css';
            }
            return isDevelopmentBuild
              ? 'assets/[name][extname]'
              : 'assets/[name]-[hash][extname]';
          },
        },
      },
    },
  };
});
