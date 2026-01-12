import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import logger from './utils/logger';

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
        logger.info('Service Worker unregistered for development');
      });
    });
  }

  // Add online/offline event listeners (works in both dev and prod)
  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine;
    logger.info(`App is ${isOnline ? 'online' : 'offline'}`);

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
          logger.info('Service Worker registered:', registration);

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
            logger.info('Service worker controller changed - reloading page');
            window.location.reload();
          });

          // Listen for background sync messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, data } = event.data;

            if (type === 'BACKGROUND_SYNC_TRIGGER') {
              logger.info('Received background sync trigger from service worker');

              // Import and trigger the sync function dynamically
              import('./providers/AppContext').then(({ useAppContext }) => {
                // This is a bit tricky since we need access to the context
                // We'll dispatch a custom event that components can listen to
                window.dispatchEvent(new CustomEvent('background-sync-triggered', {
                  detail: { timestamp: data?.timestamp }
                }));
              }).catch(err => logger.error('Failed to handle background sync:', err));
            }
          });
        })
        .catch(error => {
          logger.error('Service Worker registration failed:', error);
        });
    });
  }
}
