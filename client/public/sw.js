self.addEventListener('push', function (event) {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-72.png',
    tag: data.tag || 'medicapp',
    renotify: data.renotify || false,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    actions: [
      { action: 'taken', title: '✅ Tomado' },
      { action: 'snooze', title: '⏰ En 10 min' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'taken') {
    console.log('Medicamento marcado como tomado');
  } else if (event.action === 'snooze') {
    setTimeout(() => {
      self.registration.showNotification('💊 Recordatorio (postergado)', {
        body: event.notification.body,
        icon: '/icon-192.png'
      });
    }, 10 * 60 * 1000);
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
