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
  event.waitUntil(
    Promise.resolve().then(function () {
      var title = '💊 MedicApp';
      var body = 'Es hora de tomar tu medicamento';
      try {
        if (event.data) {
          var d = event.data.json();
          if (d.title) title = d.title;
          if (d.body) body = d.body;
        }
      } catch (e) {}
      return self.registration.showNotification(title, { body: body });
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
