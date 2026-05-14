import React, { useState, useEffect, useRef } from 'react';
import { getVapidKey, saveSubscription, testNotify, urlBase64ToUint8Array } from '../hooks/api';
import { uploadAlarmAudio, getAlarmAudioMeta, clearAlarmAudio, playAlarm } from '../hooks/audio';

export default function NotificationsPanel({ onTestSound }) {
  const [status, setStatus] = useState('idle'); // idle | subscribing | subscribed | unsupported
  const [msg, setMsg] = useState('');
  const [audioName, setAudioName] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    getAlarmAudioMeta().then(meta => setAudioName(meta.exists ? meta.name : null));
  }, []);

  async function handleAudioUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMsg('⚠️ El archivo no puede superar 5 MB.');
      return;
    }
    setUploading(true);
    setMsg('');
    try {
      await uploadAlarmAudio(file);
      setAudioName(file.name);
      setMsg('✅ Audio subido. Todos los dispositivos usarán este sonido.');
    } catch {
      setMsg('❌ Error al subir el audio. Intentá de nuevo.');
    }
    setUploading(false);
    e.target.value = '';
  }

  async function handleClearAudio() {
    await clearAlarmAudio();
    setAudioName(null);
    setMsg('Tono restablecido al predeterminado en todos los dispositivos.');
  }

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported');
      return;
    }
    if (Notification.permission === 'granted') {
      // Auto re-register subscription on every load to keep server in sync
      navigator.serviceWorker.ready.then(async reg => {
        try {
          const publicKey = await getVapidKey();
          const existing = await reg.pushManager.getSubscription();
          if (existing) {
            await saveSubscription(existing.toJSON());
            setStatus('subscribed');
          } else {
            // Permission granted but no subscription — need to re-subscribe
            setStatus('idle');
          }
        } catch (e) {
          setStatus('subscribed');
        }
      });
    }
  }, []);

  async function subscribe() {
    setStatus('subscribing');
    setMsg('');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setStatus('idle');
        setMsg('Permiso denegado. Habilitalo desde la configuración del navegador.');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const publicKey = await getVapidKey();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      await saveSubscription(sub.toJSON());
      setStatus('subscribed');
      setMsg('✅ Notificaciones activadas en este dispositivo.');
    } catch (err) {
      console.error(err);
      setStatus('idle');
      setMsg('Error al activar notificaciones: ' + err.message);
    }
  }

  async function handleTest() {
    setMsg('Enviando notificación de prueba...');
    const r = await testNotify();
    setMsg(r.sent > 0 ? '✅ Notificación enviada.' : '⚠️ No hay dispositivos suscritos.');
  }

  if (status === 'unsupported') {
    return (
      <div style={card}>
        <p style={{ color: 'var(--accent2)', fontSize: 13 }}>
          ⚠️ Este navegador no soporta notificaciones push. Usá Chrome en Android para recibir alarmas.
        </p>
      </div>
    );
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>🔔</span>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600 }}>Alarmas en este dispositivo</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {status === 'subscribed' ? 'Este dispositivo recibirá las alarmas' : 'Activá las notificaciones para recibir alarmas'}
          </p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{
            fontSize: 11, fontFamily: 'var(--font-mono)', padding: '3px 8px', borderRadius: 20,
            background: status === 'subscribed' ? 'rgba(67,233,123,0.15)' : 'rgba(255,255,255,0.07)',
            color: status === 'subscribed' ? 'var(--accent3)' : 'var(--text-muted)',
            border: `1px solid ${status === 'subscribed' ? 'rgba(67,233,123,0.3)' : 'transparent'}`
          }}>
            {status === 'subscribed' ? '● activo' : '○ inactivo'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {status !== 'subscribed' && (
          <button onClick={subscribe} disabled={status === 'subscribing'}
            style={{
              flex: 1, minWidth: 140, padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: 'var(--accent)', color: '#fff', opacity: status === 'subscribing' ? 0.7 : 1
            }}>
            {status === 'subscribing' ? 'Activando...' : '🔔 Activar alarmas'}
          </button>
        )}
        {status === 'subscribed' && (
          <button onClick={handleTest}
            style={{ flex: 1, minWidth: 140, padding: '10px 16px', borderRadius: 10, fontSize: 13, background: 'rgba(108,99,255,0.12)', color: 'var(--accent)', border: '1px solid rgba(108,99,255,0.25)' }}>
            ▶ Enviar prueba
          </button>
        )}
        {status === 'subscribed' && (
          <button onClick={subscribe}
            style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            ↺ Re-registrar
          </button>
        )}
        {onTestSound && (
          <button onClick={onTestSound}
            style={{ flex: 1, minWidth: 140, padding: '10px 16px', borderRadius: 10, fontSize: 13, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            🔊 Probar sonido
          </button>
        )}
      </div>

      {msg && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>{msg}</p>}

      {/* Audio personalizado */}
      <div style={{ marginTop: 14, padding: '14px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Sonido de alarma
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 18 }}>🔊</span>
          <span style={{ fontSize: 13, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {audioName ? audioName : 'Tono por defecto'}
          </span>
          {audioName && (
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(67,233,123,0.15)', color: 'var(--accent3)', border: '1px solid rgba(67,233,123,0.3)', whiteSpace: 'nowrap' }}>
              personalizado
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => fileInputRef.current.click()} disabled={uploading}
            style={{ flex: 1, minWidth: 120, padding: '8px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(108,99,255,0.12)', color: 'var(--accent)', border: '1px solid rgba(108,99,255,0.25)', cursor: 'pointer', opacity: uploading ? 0.6 : 1 }}>
            {uploading ? '⏳ Subiendo...' : `📁 ${audioName ? 'Cambiar MP3' : 'Subir MP3'}`}
          </button>
          <button onClick={playAlarm}
            style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer' }}>
            ▶ Probar
          </button>
          {audioName && (
            <button onClick={handleClearAudio}
              style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, background: 'rgba(255,101,132,0.1)', color: 'var(--accent2)', border: '1px solid rgba(255,101,132,0.2)', cursor: 'pointer' }}>
              ↩ Predeterminado
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="audio/mp3,audio/mpeg,audio/*" onChange={handleAudioUpload} style={{ display: 'none' }} />
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
          El audio se guarda en el servidor y suena en todos los dispositivos. Máx. 5 MB.
        </p>
      </div>

      <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          💡 <strong style={{ color: 'var(--text)' }}>¿Cómo instalar en el celular?</strong><br />
          En Chrome Android: tocá el menú (⋮) → "Añadir a pantalla de inicio".<br />
          La app funcionará como nativa y recibirás las alarmas aunque la pantalla esté apagada.
        </p>
      </div>
    </div>
  );
}

const card = {
  background: 'var(--bg-card)',
  borderRadius: 'var(--radius)',
  padding: '16px 18px',
  border: '1px solid rgba(108,99,255,0.2)',
};
