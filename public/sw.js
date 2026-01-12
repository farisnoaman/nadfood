/**
 * Service Worker for Shipment Tracker
 * Advanced PWA caching with offline support
 */

const CACHE_NAME = 'shipment-tracker-v7';
const STATIC_CACHE = 'shipment-static-v7';
const DYNAMIC_CACHE = 'shipment-dynamic-v7';
const API_CACHE = 'shipment-api-v7';

// Essential files to cache immediately
const essentialFiles = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/sw.js'
];

// Runtime caching for better performance
const runtimeCacheUrls = [
  '/src/',
  '/assets/',
  '/node_modules/'
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
            if (!name.includes('v7')) {
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

// Fetch event - intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Handle different resource types with appropriate strategies
  if (request.destination === 'document') {
    // Navigation requests - Network first, fallback to cache
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache for offline navigation
          return caches.match(request).then((cached) => {
            return cached || caches.match('/index.html');
          });
        })
    );
  } else if (request.destination === 'script' || request.destination === 'style') {
    // Static assets - Cache first, network update
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          if (response.ok) {
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        });

        return cached || networkFetch;
      })
    );
  } else if (url.pathname.startsWith('/api/')) {
    // API requests - Network only (don't cache)
    return;
  } else {
    // Other resources - Network first, cache fallback
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !url.pathname.includes('/api/')) {
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
  }
});

// Background sync for offline mutations
self.addEventListener('sync', (event) => {
  console.log('Background sync event received:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('Background sync triggered - attempting to sync offline mutations');

  try {
    // Send message to all clients to trigger sync
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      // Send message to the first client (main app window)
      const client = clients[0];
      await client.postMessage({
        type: 'BACKGROUND_SYNC_TRIGGER',
        timestamp: Date.now()
      });
      console.log('Background sync message sent to client');
    } else {
      console.warn('No clients available for background sync');
    }
  } catch (error) {
    console.error('Background sync failed:', error);
    throw error; // Re-throw to mark sync as failed
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  if (type === 'REGISTER_BACKGROUND_SYNC') {
    // Register background sync when requested
    self.registration.sync.register('background-sync')
      .then(() => {
        console.log('Background sync registered successfully');
        event.ports[0]?.postMessage({ success: true });
      })
      .catch((error) => {
        console.error('Failed to register background sync:', error);
        event.ports[0]?.postMessage({ success: false, error: error.message });
      });
  }

  if (type === 'GET_PUSH_SUBSCRIPTION') {
    // Get current push subscription
    self.registration.pushManager.getSubscription()
      .then((subscription) => {
        event.ports[0]?.postMessage({ subscription });
      })
      .catch((error) => {
        console.error('Failed to get push subscription:', error);
        event.ports[0]?.postMessage({ error: error.message });
      });
  }

  if (type === 'SUBSCRIBE_PUSH') {
    // Subscribe to push notifications
    const vapidKey = data.vapidKey;
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey
    })
    .then((subscription) => {
      console.log('Push subscription successful:', subscription);
      event.ports[0]?.postMessage({ subscription });
    })
    .catch((error) => {
      console.error('Failed to subscribe to push:', error);
      event.ports[0]?.postMessage({ error: error.message });
    });
  }

  if (type === 'UNSUBSCRIBE_PUSH') {
    // Unsubscribe from push notifications
    self.registration.pushManager.getSubscription()
      .then((subscription) => {
        if (subscription) {
          return subscription.unsubscribe();
        }
      })
      .then(() => {
        console.log('Push unsubscribed successfully');
        event.ports[0]?.postMessage({ success: true });
      })
      .catch((error) => {
        console.error('Failed to unsubscribe from push:', error);
        event.ports[0]?.postMessage({ error: error.message });
      });
  }
});

// Handle push events
self.addEventListener('push', (event) => {
  console.log('Push message received:', event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      console.warn('Failed to parse push data as JSON:', error);
      data = { body: event.data.text() };
    }
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.id || 1,
      ...data
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icon-192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: true,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Shipment Tracker',
      options
    )
  );
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    // Just dismiss the notification
    return;
  }

  // Default action or 'view' action - open the app
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});