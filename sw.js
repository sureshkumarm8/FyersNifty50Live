
const CACHE_NAME = 'nifty50-live-v4-2026-08-28';

const PRECACHE = ['/', '/index.html'];

/**
 * Caching code is what broke the Pre-Market screen: Vite serves dev modules
 * from paths like /components/PreMarketAnalyzer.tsx, which are neither in
 * /assets/ nor named *.js, so the old stale-while-revalidate rule handed the
 * browser a stale component forever while incognito (no service worker) ran
 * the current one. Only documents and images are cached now - never code.
 */
const CACHEABLE_DESTINATIONS = ['image', 'font'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      // Drop every previous cache - older versions may hold stale modules.
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

/** Lets `npm run dev` behave exactly like incognito. */
const isLocalDev = ['localhost', '127.0.0.1'].includes(self.location.hostname);

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never touch live data, and never get between the developer and their code.
  if (isLocalDev || url.pathname.startsWith('/api/')) {
    return;
  }

  // HTML: network first so a deploy is picked up immediately, cache as offline
  // fallback only.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // Images and fonts only: stale-while-revalidate.
  if (CACHEABLE_DESTINATIONS.includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Scripts, styles, modules, source files: always straight from the network.
});
