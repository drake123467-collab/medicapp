import React, { useState, useEffect } from 'react';

function buildTimeline(medications) {
  const entries = [];
  for (const med of medications) {
    if (!med.active) continue;
    for (const time of med.schedules) {
      entries.push({ ...med, time });
    }
  }
  entries.sort((a, b) => a.time.localeCompare(b.time));
  return entries;
}

function isPast(time) {
  const now = new Date();
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m < now.getHours() * 60 + now.getMinutes();
}

function isNow(time) {
  const now = new Date();
  const [h, m] = time.split(':').map(Number);
  const diff = Math.abs(h * 60 + m - (now.getHours() * 60 + now.getMinutes()));
  return diff < 30;
}

export default function TodayView({ medications }) {
  const [taken, setTaken] = useState({});
  const timeline = buildTimeline(medications);

  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const now = new Date();
  const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  function toggleTaken(key) {
    setTaken(t => ({ ...t, [key]: !t[key] }));
  }

  if (timeline.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>💊</p>
        <p style={{ fontSize: 15 }}>No hay medicamentos activos.</p>
        <p style={{ fontSize: 13 }}>Agregá uno desde el panel de administración.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{dateStr}</p>
        <h2 style={{ fontSize: 22, fontWeight: 600 }}>{greeting}, Juan Carlos</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          {timeline.filter((e) => taken[`${e.id}-${e.time}`]).length} de {timeline.length} tomados hoy
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {timeline.map((entry, i) => {
          const key = `${entry.id}-${entry.time}`;
          const isTaken = taken[key];
          const past = isPast(entry.time);
          const now2 = isNow(entry.time);

          return (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: now2 && !isTaken ? `${entry.color}18` : 'var(--bg-card)',
              borderRadius: 14,
              padding: '14px 16px',
              border: now2 && !isTaken ? `1px solid ${entry.color}44` : '1px solid transparent',
              opacity: isTaken ? 0.5 : 1,
              transition: 'all 0.2s'
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
                color: isTaken ? 'var(--text-muted)' : past ? 'var(--text-muted)' : entry.color,
                minWidth: 44, textAlign: 'center'
              }}>{entry.time}</div>

              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, textDecoration: isTaken ? 'line-through' : 'none' }}>
                  {entry.name}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entry.dose}</p>
              </div>

              {now2 && !isTaken && (
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${entry.color}33`, color: entry.color, fontFamily: 'var(--font-mono)' }}>ahora</span>
              )}

              <button onClick={() => toggleTaken(key)}
                style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: isTaken ? 'rgba(67,233,123,0.15)' : 'rgba(255,255,255,0.07)',
                  color: isTaken ? 'var(--accent3)' : 'var(--text-muted)',
                  border: `1.5px solid ${isTaken ? 'rgba(67,233,123,0.4)' : 'rgba(255,255,255,0.12)'}`,
                  fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                {isTaken ? '✓' : '○'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
