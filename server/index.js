const express = require('express');
const cors = require('cors');
const webpush = require('web-push');
const cron = require('node-cron');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

const DATA_DIR = process.env.DATA_DIR || __dirname;
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const SUBS_FILE = path.join(DATA_DIR, 'subscriptions.json');

// VAPID keys — generá las tuyas con: npx web-push generate-vapid-keys
// Y ponelas en variables de entorno en Railway
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'UUxI4O8-FbRouAevSmBQ6o_gc_HMi7cVYLQqP5';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@medicapp.com';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

app.use(cors());
app.use(express.json());

// Serve static React build
app.use(express.static(path.join(__dirname, '../client/dist')));

// --- Data helpers ---
async function readData() {
  try {
    return await fs.readJson(DATA_FILE);
  } catch {
    return { medications: [] };
  }
}

async function writeData(data) {
  await fs.writeJson(DATA_FILE, data, { spaces: 2 });
}

async function readSubs() {
  try {
    return await fs.readJson(SUBS_FILE);
  } catch {
    return { subscriptions: [] };
  }
}

async function writeSubs(data) {
  await fs.writeJson(SUBS_FILE, data, { spaces: 2 });
}

// --- API Routes ---

// Get all medications
app.get('/api/medications', async (req, res) => {
  const data = await readData();
  res.json(data.medications);
});

// Add medication
app.post('/api/medications', async (req, res) => {
  const data = await readData();
  const med = {
    id: Date.now().toString(),
    name: req.body.name,
    dose: req.body.dose,
    schedules: req.body.schedules || [], // array de "HH:MM"
    notes: req.body.notes || '',
    color: req.body.color || '#4F7EFF',
    active: true,
    createdAt: new Date().toISOString()
  };
  data.medications.push(med);
  await writeData(data);
  res.json(med);
});

// Update medication
app.put('/api/medications/:id', async (req, res) => {
  const data = await readData();
  const idx = data.medications.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data.medications[idx] = { ...data.medications[idx], ...req.body };
  await writeData(data);
  res.json(data.medications[idx]);
});

// Delete medication
app.delete('/api/medications/:id', async (req, res) => {
  const data = await readData();
  data.medications = data.medications.filter(m => m.id !== req.params.id);
  await writeData(data);
  res.json({ ok: true });
});

// Save push subscription
app.post('/api/subscribe', async (req, res) => {
  const subs = await readSubs();
  const sub = req.body;
  const exists = subs.subscriptions.find(s => s.endpoint === sub.endpoint);
  if (!exists) {
    subs.subscriptions.push(sub);
    await writeSubs(subs);
  }
  res.json({ ok: true });
});

// VAPID public key (client needs it to subscribe)
app.get('/api/vapid-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC });
});

// Upload custom alarm audio
app.post('/api/alarm-audio', express.raw({ type: '*/*', limit: '5mb' }), async (req, res) => {
  const name = decodeURIComponent(req.headers['x-filename'] || 'alarm.mp3');
  await fs.writeFile(path.join(DATA_DIR, 'alarm.mp3'), req.body);
  await fs.writeJson(path.join(DATA_DIR, 'alarm-meta.json'), { name });
  res.json({ ok: true });
});

// Get alarm audio metadata
app.get('/api/alarm-audio/meta', async (req, res) => {
  const exists = await fs.pathExists(path.join(DATA_DIR, 'alarm.mp3'));
  if (!exists) return res.json({ exists: false });
  const meta = await fs.readJson(path.join(DATA_DIR, 'alarm-meta.json')).catch(() => ({ name: 'alarm.mp3' }));
  res.json({ exists: true, name: meta.name });
});

// Serve alarm audio file
app.get('/api/alarm-audio', async (req, res) => {
  const filePath = path.join(DATA_DIR, 'alarm.mp3');
  if (!await fs.pathExists(filePath)) return res.status(404).json({ error: 'No custom audio' });
  res.setHeader('Content-Type', 'audio/mpeg');
  res.sendFile(filePath);
});

// Delete alarm audio
app.delete('/api/alarm-audio', async (req, res) => {
  await fs.remove(path.join(DATA_DIR, 'alarm.mp3')).catch(() => {});
  await fs.remove(path.join(DATA_DIR, 'alarm-meta.json')).catch(() => {});
  res.json({ ok: true });
});

// Test push notification
app.post('/api/test-notify', async (req, res) => {
  const subs = await readSubs();
  const payload = JSON.stringify({
    title: '💊 MedicApp - Prueba',
    body: '¡Las notificaciones funcionan correctamente!',
    icon: '/icon-192.png'
  });
  const results = await sendToAll(subs.subscriptions, payload);
  res.json({ sent: results.length });
});

// Catch-all → React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// --- Push notification sender ---
async function sendToAll(subscriptions, payload) {
  const results = [];
  const subs = await readSubs();
  const dead = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, payload);
      results.push(sub.endpoint);
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        dead.push(sub.endpoint);
      }
    }
  }

  if (dead.length > 0) {
    subs.subscriptions = subs.subscriptions.filter(s => !dead.includes(s.endpoint));
    await writeSubs(subs);
  }

  return results;
}

// --- Cron: check medications every minute ---
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hh}:${mm}`;

  const data = await readData();
  const subs = await readSubs();

  if (subs.subscriptions.length === 0) return;

  for (const med of data.medications) {
    if (!med.active) continue;
    if (med.schedules.includes(currentTime)) {
      const payload = JSON.stringify({
        title: `💊 Hora de tomar: ${med.name}`,
        body: `Dosis: ${med.dose}${med.notes ? ' — ' + med.notes : ''}`,
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        tag: `med-${med.id}-${currentTime}`,
        renotify: true
      });
      await sendToAll(subs.subscriptions, payload);
      console.log(`[${currentTime}] Notificación enviada: ${med.name}`);
    }
  }
});

app.listen(PORT, () => {
  console.log(`MedicApp server running on port ${PORT}`);
});
