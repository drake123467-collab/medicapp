const CACHE = 'medicapp-v1';
const SHELL = ['/', '/icon-192.png', '/icon-512.png', '/alarm.mp3'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

function playDefaultTone(ctx) {
  [[0, 880], [0.32, 880], [0.64, 1100]].forEach(([t, freq]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.5, ctx.currentTime + t);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
    osc.start(ctx.currentTime + t);
    osc.stop(ctx.currentTime + t + 0.3);
  });
}

async function playAlarmInSW() {
  try {
    const ctx = new AudioContext();
    // Try custom uploaded audio, then fall back to bundled alarm.mp3
    const custom = await fetch('/api/alarm-audio').catch(() => null);
    const res = custom?.ok ? custom : await fetch('/alarm.mp3');
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(buffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    } else {
      playDefaultTone(ctx);
    }
  } catch (e) {}
}

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
    Promise.all([
      self.registration.showNotification(data.title, options),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        clients.forEach(c => c.postMessage({ type: 'PLAY_ALARM' }));
        if (clients.length === 0) playAlarmInSW();
      })
    ])
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
