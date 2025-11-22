import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service Worker and online/offline detection
if ('serviceWorker' in navigator) {
  // First, unregister any existing service workers in development
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
        console.log('Service Worker unregistered for development');
      });
    });
  }
  
  // Add online/offline event listeners (works in both dev and prod)
  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine;
    console.log(`App is ${isOnline ? 'online' : 'offline'}`);
    
    // Dispatch custom event for app components to listen to
    window.dispatchEvent(new CustomEvent('app-online-status', { 
      detail: { online: isOnline } 
    }));
  };
  
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Initial status check
  updateOnlineStatus();
  
  // Only register service worker in production
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
          
          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                if (confirm('تحديث جديد متاح. هل تريد إعادة التحميل؟')) {
                  window.location.reload();
                }
              }
            });
          });
          
          // Check for updates periodically (every 30 minutes)
          setInterval(() => {
            registration.update();
          }, 30 * 60 * 1000);
          
          // Listen for controlling service worker changes
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service worker controller changed - reloading page');
            window.location.reload();
          });
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
}
