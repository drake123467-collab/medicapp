import React, { useState, useEffect } from 'react';
import { getVapidKey, saveSubscription, testNotify, urlBase64ToUint8Array } from '../hooks/api';

export default function NotificationsPanel({ onTestSound }) {
  const [status, setStatus] = useState('idle'); // idle | subscribing | subscribed | unsupported
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported');
    } else if (Notification.permission === 'granted') {
      setStatus('subscribed');
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
        {onTestSound && (
          <button onClick={onTestSound}
            style={{ flex: 1, minWidth: 140, padding: '10px 16px', borderRadius: 10, fontSize: 13, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            🔊 Probar sonido
          </button>
        )}
      </div>

      {msg && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>{msg}</p>}

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
