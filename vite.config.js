import { defineConfig } from 'vite';
import { resolve } from 'path';

// Mirror Vercel's cleanUrls + rewrites so `npm run dev` matches production routing
function cleanUrlsDevPlugin() {
  const routeMap = {
    '/states': '/states.html',
    '/cities': '/cities.html',
    '/city': '/city.html',
    '/studio': '/studio.html',
    '/about': '/about.html',
    '/about-pilates-finder': '/about.html',
    '/contact': '/contact.html',
    '/contact-us': '/contact.html'
  };

  return {
    name: 'clean-urls-dev',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const [path, query] = req.url.split('?');
        if (routeMap[path]) {
          req.url = routeMap[path] + (query ? '?' + query : '');
        }
        next();
      });
    }
  };
}

export default defineConfig({
  root: '.',
  base: '/',
  publicDir: 'public',
  plugins: [cleanUrlsDevPlugin()],
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
        entryFileNames: 'assets/[name].js',
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
    strictPort: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
