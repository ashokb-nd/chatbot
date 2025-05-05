const CACHE_NAME = 'noticeboard-cache-v1';
const urlsToCache = [
  '/chatbot/',
  '/chatbot/index.html',
  '/chatbot/scripts/noticeboard.js',
  '/chatbot/styles/main.css',
  '/chatbot/styles/header.css',
  '/chatbot/styles/form.css',
  '/chatbot/styles/notices.css',
  '/chatbot/icons/icon-192x192.png',
  '/chatbot/icons/icon-512x512.png'
];

// Install the service worker and cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Serve cached content when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Update the service worker and clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
