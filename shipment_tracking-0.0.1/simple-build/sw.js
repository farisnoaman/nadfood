
const CACHE_NAME = 'shipment-tracker-cache-v9';

// Files to pre-cache for offline support
// Note: App now uses IndexedDB for all offline data storage (50MB+ capacity)
const PRECACHE_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/assets/index-DV_yzYPn.js',
  '/assets/index.es-WBxGSqE1.js',
  '/assets/purify.es-C_uT9hQ1.js'
];

// External resources to cache (will be fetched and cached during install)
const EXTERNAL_RESOURCES = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap'
];

// Install the service worker and pre-cache essential files
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Pre-caching app shell...');
        // Cache local files
        return cache.addAll(PRECACHE_FILES)
          .then(() => {
            // Try to cache external resources (don't fail if they're unavailable)
            return Promise.allSettled(
              EXTERNAL_RESOURCES.map(url => 
                fetch(url, { mode: 'cors' })
                  .then(response => {
                    if (response.ok) {
                      return cache.put(url, response);
                    }
                  })
                  .catch(err => console.log('Could not cache external resource:', url, err))
              )
            );
          });
      })
      .then(() => {
        console.log('Pre-caching complete!');
        return self.skipWaiting();
      })
  );
});

// Activate the service worker and clean up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated, claiming clients...');
      return self.clients.claim();
    })
  );
});

// Intercept fetch requests and serve from cache if available.
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Always go to the network for Supabase API calls
  // Let AppContext handle offline state with cached localStorage data
  if (requestUrl.origin.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request).catch(err => {
        console.log('SW: Supabase fetch failed (offline mode)');
        // Return a proper error response that AppContext can handle
        return new Response(JSON.stringify({ 
          error: 'Network unavailable', 
          offline: true 
        }), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // For navigation requests (e.g., loading the app), serve cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html')
        .then(response => {
          if (response) {
            return response;
          }
          // Fallback to network
          return fetch(event.request).then(networkResponse => {
            // Cache the response for future offline use
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put('/index.html', responseToCache);
            });
            return networkResponse;
          });
        })
        .catch(() => {
          // Return cached index.html as last resort
          return caches.match('/index.html');
        })
    );
    return;
  }

  // For other requests (assets, scripts, styles), use cache-first with network fallback
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Serve from cache
        }
        
        // Not in cache, fetch from network
        return fetch(event.request).then(networkResponse => {
          // Don't cache if not a valid response
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          // Cache the response for future use
          // Handle both same-origin and cross-origin (CORS) responses
          if (networkResponse.type === 'basic' || networkResponse.type === 'cors') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          
          return networkResponse;
        });
      })
      .catch(() => {
        // Network failed and not in cache
        console.log('SW: Request failed (offline), no cache available for:', event.request.url);
        
        // For JS/CSS files, return an empty response to prevent errors
        if (event.request.url.endsWith('.js')) {
          return new Response('// Offline - resource unavailable', {
            headers: { 'Content-Type': 'application/javascript' }
          });
        }
        if (event.request.url.endsWith('.css')) {
          return new Response('/* Offline - resource unavailable */', {
            headers: { 'Content-Type': 'text/css' }
          });
        }
        
        return new Response('Offline - resource unavailable', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});

// Listen for messages from the app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
