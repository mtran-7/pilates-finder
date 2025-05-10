import { defineConfig } from 'vite';
import { resolve } from 'path';

function toKebabCase(str) {
  return str.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
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
          // Keep original names for specific files
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
  server: {
    open: true,
    port: 5173,
    strictPort: true,
    middlewareMode: false,
    middleware: [
      (req, res, next) => {
        // Convert URL encoded spaces and format URLs
        const originalUrl = req.url;
        const decodedUrl = decodeURIComponent(originalUrl);
        const parts = decodedUrl.split('/').filter(Boolean);
        
        if (parts.length > 0) {
          // Format state names
          parts[0] = toKebabCase(parts[0]);
          
          // Format city names if present
          if (parts.length > 1) {
            parts[1] = toKebabCase(parts[1]);
          }
          
          req.url = '/' + parts.join('/');
        }

        // Route handling
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
          default:
            if (req.url.match(/^\/[^/]+$/)) {
              req.url = '/cities.html';
            } else if (req.url.match(/^\/[^/]+\/[^/]+$/)) {
              req.url = '/city.html';
            }
        }
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