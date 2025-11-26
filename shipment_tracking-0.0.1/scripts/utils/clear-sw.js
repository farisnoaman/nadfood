// Clear all service worker caches and unregister
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('Unregistered service worker:', registration.scope);
    });
  });
  
  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
        console.log('Deleted cache:', cacheName);
      });
    });
  }
  
  console.log('All service workers and caches cleared');
}