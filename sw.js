
const CACHE_NAME = 'nifty50-live-v2';
const urlsToCache = [
  '/',
  '/index.html',
  // Vite usually bundles css/js, so we rely on runtime caching for those
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 1. API Requests: Network Only (Never cache live stock data)
  if (event.request.url.includes('/api/')) {
    return; 
  }

  // 2. Static Assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Only cache basic/cors responses that can be cloned
        if (networkResponse && networkResponse.status === 200 && 
            (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
          try {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache).catch(() => {
                // Silently ignore cache write failures
              });
            });
          } catch (e) {
            // Silently ignore clone/cache errors
          }
        }
        return networkResponse;
      }).catch(() => {
        // If network fails, return cached response or undefined
        return cachedResponse;
      });

      // Return cached response immediately if available, else wait for network
      return cachedResponse || fetchPromise;
    }).catch(() => {
      // Fallback if caches.match fails
      return fetch(event.request).catch(() => {
        // Both cache and network failed, return nothing
      });
    })
  );
});
