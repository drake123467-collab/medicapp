self.addEventListener('install', e => { e.waitUntil(self.skipWaiting()); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
});

self.addEventListener('push', function(event) {
  var notifPromise = self.registration.showNotification('Recordatorio de medicamento', {
    body: 'Es hora de tomar tu medicamento',
    icon: '/icon-192.png'
  }).then(function() {
    return fetch('/api/sw-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, t: Date.now() })
    }).catch(function() {});
  }).catch(function(err) {
    return fetch('/api/sw-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: String(err), t: Date.now() })
    }).catch(function() {});
  });
  event.waitUntil(notifPromise);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
