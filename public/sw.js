const CACHE_NAME = 'jay-kay-digital-v3';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/lovable-uploads/fe0d95c7-827d-4f6a-b10f-79b98ad605ab.png',
  '/lovable-uploads/6547acd2-7a0c-4b2d-ad63-4957c2a7b57b.png'
];

// Install event - cache basic resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
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
    }).then(() => self.clients.claim())
  );
});

// Fetch event - only handle specific requests to avoid conflicts
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip dynamic imports and JS modules to prevent conflicts
  if (event.request.url.includes('/assets/') && event.request.url.includes('.js')) {
    return;
  }

  // Only handle navigation requests and static assets
  if (event.request.mode === 'navigate' || 
      event.request.url.includes('/lovable-uploads/') ||
      event.request.url.includes('/manifest.json')) {
    
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(event.request).then((response) => {
            // Only cache successful responses for specific resources
            if (response && response.status === 200 && response.type === 'basic') {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return response;
          }).catch(() => {
            // Return cached home page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
        })
    );
  }
});