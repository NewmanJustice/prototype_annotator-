import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  if (mode === 'overlay') {
    return {
      plugins: [preact()],
      build: {
        lib: {
          entry: resolve(__dirname, 'client/overlay/index.tsx'),
          name: 'PrototypeAnnotatorOverlay',
          fileName: 'overlay',
          formats: ['iife'],
        },
        outDir: 'client/dist',
        emptyOutDir: false,
        sourcemap: true,
        minify: true,
        rollupOptions: {
          output: {
            entryFileNames: 'overlay.js',
            inlineDynamicImports: true,
          },
        },
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
    };
  }

  // Dashboard mode
  return {
    plugins: [preact()],
    root: resolve(__dirname, 'client/dashboard'),
    base: './',  // Use relative paths so basePath config is respected
    build: {
      outDir: resolve(__dirname, 'client/dist/dashboard'),
      emptyOutDir: true,
      sourcemap: true,
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
  };
});
