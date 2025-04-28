const CACHE_NAME = 'pilates-finder-v1';
const PHOTO_CACHE = 'photo-cache-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(
        fetch('/plates_studios.json')
            .then(response => response.json())
            .then(data => {
                const photoUrls = data.studios.map(studio => studio.photoUrl);
                const cache = caches.open(PHOTO_CACHE);
                return cache.addAll(photoUrls);
            })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('api.example.com/photo')) {
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(event.request)
                        .then(response => {
                            const cache = caches.open(PHOTO_CACHE);
                            cache.put(event.request, response.clone());
                            return response;
                        });
                })
        );
    }
});
