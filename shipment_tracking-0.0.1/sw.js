
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

  // Skip caching for Vite development assets and HMR
  if (requestUrl.pathname.includes('@vite') || 
      requestUrl.pathname.includes('@react-refresh') ||
      requestUrl.pathname.includes('hot-update') ||
      requestUrl.search.includes('t=') && requestUrl.pathname.includes('.tsx')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Always go to the network for Supabase API calls to ensure freshness or fail if offline (handled by AppContext).
  // Caching API calls in SW can lead to complex stale data issues.
  if (requestUrl.origin.includes('supabase.co')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For navigation requests (e.g., loading the app), always serve index.html for SPA routing
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If network fails, try to serve from cache first
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to cached index.html for any navigation
          return caches.match('/index.html');
        });
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
            // Don't cache non-successful responses or development assets
            if (!networkResponse || 
                networkResponse.status !== 200 || 
                networkResponse.type === 'error' ||
                requestUrl.pathname.includes('@vite') ||
                requestUrl.pathname.includes('@react-refresh')) {
              return networkResponse;
            }

            // Clone the response to cache it
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
              .catch(err => {
                // Ignore cache errors for development
                console.warn('Cache put failed:', err);
              });
            return networkResponse;
          }
        );
      })
      .catch(() => {
        // Fallback for when both cache and network fail
        // For images, return a placeholder
        if (event.request.destination === 'image') {
          return new Response('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#ccc"/><text x="50%" y="50%" text-anchor="middle" dy=".3em">No Image</text></svg>', {
            headers: { 'Content-Type': 'image/svg+xml' }
          });
        }
      })
  );
});