self.addEventListener('install', e => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
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
  let title = '💊 MedicApp';
  let body = 'Recordatorio de medicamento';

  try {
    if (event.data) {
      const d = event.data.json();
      if (d.title) title = d.title;
      if (d.body) body = d.body;
    }
  } catch (e) {}

  // Audio y mensajes a clientes: fire-and-forget, nunca bloquean la notificación
  self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then(clients => {
      if (clients.length > 0) {
        clients.forEach(c => { try { c.postMessage({ type: 'PLAY_ALARM' }); } catch (e) {} });
      } else {
        playAlarmInSW();
      }
    }).catch(() => {});

  // Solo la notificación va en waitUntil — mínima y robusta
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      tag: 'medicapp',
      renotify: true,
      vibrate: [300, 100, 300, 100, 300],
    })
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
