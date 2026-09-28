/* Union Inventory Service Worker */
const CACHE_NAME = 'union-inventory-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Required for Chrome PWA installability
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // Optional: return a simple offline fallback
      return new Response('You are offline', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' },
      });
    })
  );
});
