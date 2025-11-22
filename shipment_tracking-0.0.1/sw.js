
const CACHE_NAME = 'shipment-tracker-cache-v6';

// Install the service worker immediately
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate the service worker and clean up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Intercept fetch requests and serve from cache if available.
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Always go to the network for Supabase API calls to ensure freshness or fail if offline (handled by AppContext).
  // Caching API calls in SW can lead to complex stale data issues.
  if (requestUrl.origin.includes('supabase.co')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For navigation requests (e.g., loading the app), use a cache-first strategy.
  // This ensures the SPA loads even if offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request).catch(() => caches.match('/index.html'));
        })
    );
    return;
  }

  // For other requests (assets, scripts, styles), try cache then network.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Serve from cache
        }
        // Not in cache, fetch from network
        return fetch(event.request).then(
          networkResponse => {
            // Don't cache third-party scripts from CDNs automatically unless needed, 
            // but generally we want to cache everything for full offline PWA.
            // We exclude opaque responses mostly, but for ESM/Fonts we might want them.
            // Here we just ensure it's valid.
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
              return networkResponse;
            }

            // Clone the response to cache it
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        );
      })
      .catch(() => {
        // Fallback for when both cache and network fail
        // Can return a fallback image here if needed.
      })
  );
});