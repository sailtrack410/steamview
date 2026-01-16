import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Icons from "unplugin-icons/vite";
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  mode: 'production',
  plugins: [
    vue(),
    Icons({ compiler: 'vue3' }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'build/frontend',
    emptyOutDir: true,
    lib: {
      entry: fileURLToPath(new URL('./src/app.ts', import.meta.url)),
      name: 'steamview',
      formats: ['iife'],
      fileName: () => 'app.js',
      cssFileName: 'app'
    },
    rollupOptions: {
      output: {
        globals: {}
      }
    }
  }
});