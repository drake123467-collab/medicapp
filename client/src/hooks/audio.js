const DB_NAME = 'medicapp-db';
const STORE = 'alarm';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => {
      if (!e.target.result.objectStoreNames.contains(STORE)) {
        e.target.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveAlarmAudio(file) {
  const buffer = await file.arrayBuffer();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ buffer, name: file.name }, 'custom');
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAlarmAudio() {
  try {
    const db = await openDB();
    return new Promise(resolve => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get('custom');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function clearAlarmAudio() {
  const db = await openDB();
  return new Promise(resolve => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete('custom');
    tx.oncomplete = resolve;
  });
}

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

export async function playAlarm() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const data = await getAlarmAudio();
    if (data?.buffer) {
      const audioBuffer = await ctx.decodeAudioData(data.buffer.slice(0));
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    } else {
      playDefaultTone(ctx);
    }
  } catch (e) {
    console.error('playAlarm error:', e);
  }
}
