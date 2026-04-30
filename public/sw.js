// Service Worker for Golden Beans PWA
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Golden Beans';
  const options = {
    body: data.body || 'New request!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [400, 100, 400, 100, 400],
    requireInteraction: true,
    data: { url: data.url || '/waiter' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/waiter') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/waiter');
      }
    })
  );
});