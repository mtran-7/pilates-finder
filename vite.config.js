import { defineConfig } from 'vite';
import { resolve } from 'path';

function toKebabCase(str) {
  return str ? str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
}

export default defineConfig({
  root: '.',
  base: '/', // Ensure base is root
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        states: resolve(__dirname, 'states.html'),
        cities: resolve(__dirname, '[state]/cities.html'),
        city: resolve(__dirname, 'city.html'),
        studio: resolve(__dirname, 'studio.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html')
      },
      output: {
        entryFileNames: 'assets/[name].js', // Avoid hashing for simplicity
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name.split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(extType)) {
            return 'assets/images/[name][extname]';
          }
          if (extType === 'css') {
            return 'assets/[name][extname]'; // Ensure styles.css stays as styles.css
          }
          return 'assets/[name][extname]';
        }
      }
    }
  },
  server: {
    open: true,
    port: 5173,
    strictPort: true,
    middlewareMode: false,
    middleware: [
      (req, res, next) => {
        console.log('Original URL:', req.url);
        next();
      }
    ]
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});