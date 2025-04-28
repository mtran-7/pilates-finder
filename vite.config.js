import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        states: resolve(__dirname, 'states.html'),
        cities: resolve(__dirname, 'cities.html'),
        city: resolve(__dirname, 'city.html'),
        studio: resolve(__dirname, 'studio.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html')
      },
      output: {
        manualChunks: {
          vendor: ['fuse.js']
        }
      }
    },
    minify: true,
    sourcemap: true
  },
  plugins: [],
  server: {
    port: 3000
  }
});
