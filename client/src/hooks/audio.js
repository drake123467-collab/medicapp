export async function uploadAlarmAudio(file) {
  const res = await fetch('/api/alarm-audio', {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'audio/mpeg',
      'X-Filename': encodeURIComponent(file.name),
    },
    body: file,
  });
  if (!res.ok) throw new Error('Error al subir el audio');
  return res.json();
}

export async function getAlarmAudioMeta() {
  try {
    const res = await fetch('/api/alarm-audio/meta');
    return res.ok ? res.json() : { exists: false };
  } catch {
    return { exists: false };
  }
}

export async function clearAlarmAudio() {
  await fetch('/api/alarm-audio', { method: 'DELETE' });
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
  } catch (e) {
    console.error('playAlarm error:', e);
  }
}
