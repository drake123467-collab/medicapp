import React from 'react';

function getNextDose(schedules) {
  if (!schedules || schedules.length === 0) return null;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const sorted = [...schedules].sort();
  for (const t of sorted) {
    const [h, m] = t.split(':').map(Number);
    const min = h * 60 + m;
    if (min > nowMin) return t;
  }
  return sorted[0] + ' (mañana)';
}

export default function MedicationCard({ med, onEdit, onDelete, onToggle }) {
  const next = getNextDose(med.schedules);

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius)',
      padding: '18px 20px',
      borderLeft: `4px solid ${med.color}`,
      opacity: med.active ? 1 : 0.45,
      transition: 'opacity 0.2s',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 80, height: 80,
        background: med.color, opacity: 0.06, borderRadius: '0 0 0 80px'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: med.color, display: 'inline-block', flexShrink: 0
            }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{med.name}</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, paddingLeft: 18 }}>{med.dose}</p>
          {med.notes && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', paddingLeft: 18, fontStyle: 'italic', marginBottom: 8 }}>
              📝 {med.notes}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {med.schedules.map(t => (
          <span key={t} style={{
            background: `${med.color}22`,
            color: med.color,
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            padding: '3px 10px',
            borderRadius: 20,
            fontWeight: 700,
            border: `1px solid ${med.color}44`
          }}>{t}</span>
        ))}
      </div>

      {next && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, fontFamily: 'var(--font-mono)' }}>
          ⏰ próxima: <strong style={{ color: 'var(--text)' }}>{next}</strong>
        </p>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onToggle(med)}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, fontWeight: 500,
            background: med.active ? 'rgba(67,233,123,0.1)' : 'rgba(255,255,255,0.06)',
            color: med.active ? 'var(--accent3)' : 'var(--text-muted)',
            border: `1px solid ${med.active ? 'rgba(67,233,123,0.25)' : 'transparent'}`
          }}>
          {med.active ? '✓ Activo' : '— Pausado'}
        </button>
        <button onClick={() => onEdit(med)}
          style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(108,99,255,0.12)', color: 'var(--accent)', fontSize: 13, border: 'none' }}>
          ✎ Editar
        </button>
        <button onClick={() => onDelete(med.id)}
          style={{ padding: '8px 14px', borderRadius: 8, background: 'rgba(255,101,132,0.1)', color: 'var(--accent2)', fontSize: 13, border: 'none' }}>
          🗑
        </button>
      </div>
    </div>
  );
}
