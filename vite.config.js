import { defineConfig } from 'vite';
import { resolve } from 'path';

function toKebabCase(str) {
  return str ? str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
}

export default defineConfig({
  root: '.',
  base: '/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
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
        entryFileNames: (chunkInfo) => {
          if (['city', 'studio'].includes(chunkInfo.name)) {
            return 'assets/[name].js';
          }
          return 'assets/[name].js';
        },
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name.split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(extType)) {
            return 'assets/images/[name][extname]';
          }
          return 'assets/[name][extname]';
        }
      }
    }
  },
  optimizeDeps: {
    force: true // Fix deprecation warning
  },
  server: {
    port: 3000,
    host: 'localhost',
    strictPort: false,
    open: true,
    watch: {
      usePolling: true
    },
    fs: {
      strict: false
    },
    middlewareMode: true,
    middleware: [
      (req, res, next) => {
        console.log('Original URL:', req.url);
        const originalUrl = req.url;
        const decodedUrl = decodeURIComponent(originalUrl);
        const parts = decodedUrl.split('/').filter(Boolean);
        console.log('Decoded parts:', parts);

        if (parts.length > 0) {
          parts.forEach((part, index) => parts[index] = toKebabCase(part));
          req.url = '/' + parts.join('/');
        }

        console.log('Modified URL:', req.url);

        if (parts.length === 2) {
          req.url = '/city.html';
        } else if (parts.length === 1) {
          req.url = '/cities.html';
        } else {
          switch (req.url) {
            case '/states':
              req.url = '/states.html';
              break;
            case '/contact-us':
              req.url = '/contact.html';
              break;
            case '/about-pilates-finder':
              req.url = '/about.html';
              break;
            case '/':
            case '/index.html':
              req.url = '/index.html';
              break;
            default:
              req.url = '/404.html'; // Ensure you have a 404.html
          }
        }

        console.log('Final URL:', req.url);
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