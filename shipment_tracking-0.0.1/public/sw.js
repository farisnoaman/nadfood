/**
 * Service Worker for Shipment Tracker
 * Simple and robust offline caching
 */

const CACHE_NAME = 'shipment-tracker-v5';
const STATIC_CACHE = 'shipment-static-v5';
const DYNAMIC_CACHE = 'shipment-dynamic-v5';

// Essential files to cache immediately
const essentialFiles = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(essentialFiles))
      .then(() => self.skipWaiting())
      .catch((error) => console.error('Service worker install failed:', error))
  );
});

// Activate event - clean up and take control
self.addEventListener('activate', (event) => {
  console.log('Activating service worker...');
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((names) =>
        Promise.all(
          names.map((name) => {
            if (!name.includes('v5')) {
              console.log('Deleting old cache:', name);
              return caches.delete(name);
            }
          })
        )
      ),
      // Take control immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - cache everything from same origin
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip external requests (fonts, etc.)
  if (url.origin !== self.location.origin) return;

  // Handle all same-origin requests with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        if (cached) {
          // Return cached version and update in background
          fetch(request).then((response) => {
            if (response.ok) {
              caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, response));
            }
          }).catch(() => {});
          return cached;
        }

        // Fetch from network and cache
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return response;
        });
      })
      .catch(() => {
        // If everything fails, try to serve index.html for navigation requests
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
        // Return offline message for other requests
        return new Response('Offline', { status: 503 });
      })
  );
});