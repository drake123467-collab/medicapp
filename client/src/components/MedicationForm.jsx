import React, { useState } from 'react';

const COLORS = [
  '#6c63ff', '#ff6584', '#43e97b', '#f7971e',
  '#00c6ff', '#fc5c7d', '#a18cd1', '#ffecd2'
];

const FREQ_PRESETS = [
  { label: 'Cada 8 horas', times: ['08:00', '16:00', '00:00'] },
  { label: 'Cada 12 horas', times: ['08:00', '20:00'] },
  { label: 'Una vez al día (mañana)', times: ['08:00'] },
  { label: 'Una vez al día (noche)', times: ['21:00'] },
  { label: 'Tres veces al día', times: ['08:00', '14:00', '20:00'] },
  { label: 'Personalizado', times: [] },
];

export default function MedicationForm({ onSave, onCancel, initial }) {
  const [name, setName] = useState(initial?.name || '');
  const [dose, setDose] = useState(initial?.dose || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [color, setColor] = useState(initial?.color || COLORS[0]);
  const [schedules, setSchedules] = useState(initial?.schedules || ['08:00']);
  const [freqLabel, setFreqLabel] = useState('Personalizado');

  function applyPreset(preset) {
    setFreqLabel(preset.label);
    if (preset.times.length > 0) setSchedules([...preset.times]);
  }

  function addSchedule() {
    setSchedules([...schedules, '08:00']);
    setFreqLabel('Personalizado');
  }

  function removeSchedule(i) {
    setSchedules(schedules.filter((_, idx) => idx !== i));
  }

  function updateSchedule(i, val) {
    const s = [...schedules];
    s[i] = val;
    setSchedules(s);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !dose.trim() || schedules.length === 0) return;
    onSave({ name: name.trim(), dose: dose.trim(), notes: notes.trim(), color, schedules });
  }

  return (
    <div style={overlay}>
      <form onSubmit={handleSubmit} style={modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text)' }}>
            {initial ? 'Editar medicamento' : 'Nuevo medicamento'}
          </h2>
          <button type="button" onClick={onCancel} style={closeBtnStyle}>✕</button>
        </div>

        <div style={field}>
          <label style={labelStyle}>Nombre del medicamento</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Metformina" required />
        </div>

        <div style={field}>
          <label style={labelStyle}>Dosis</label>
          <input value={dose} onChange={e => setDose(e.target.value)} placeholder="Ej: 500mg — 1 comprimido" required />
        </div>

        <div style={field}>
          <label style={labelStyle}>Notas adicionales</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Ej: Tomar con comida" rows={2}
            style={{ resize: 'vertical', minHeight: 60 }} />
        </div>

        <div style={field}>
          <label style={labelStyle}>Color identificador</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)}
                style={{
                  width: 30, height: 30, borderRadius: '50%', background: c,
                  border: color === c ? '3px solid #fff' : '3px solid transparent',
                  outline: 'none', cursor: 'pointer', transition: 'border 0.15s'
                }} />
            ))}
          </div>
        </div>

        <div style={field}>
          <label style={labelStyle}>Frecuencia</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {FREQ_PRESETS.map(p => (
              <button key={p.label} type="button" onClick={() => applyPreset(p)}
                style={{
                  padding: '5px 10px', borderRadius: 20, fontSize: 12,
                  background: freqLabel === p.label ? 'var(--accent)' : 'rgba(255,255,255,0.07)',
                  color: 'var(--text)', border: 'none', cursor: 'pointer'
                }}>{p.label}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {schedules.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="time" value={s} onChange={e => updateSchedule(i, e.target.value)}
                  style={{ flex: 1, cursor: 'pointer' }} />
                {schedules.length > 1 && (
                  <button type="button" onClick={() => removeSchedule(i)}
                    style={{ background: 'rgba(255,101,132,0.15)', color: 'var(--accent2)', padding: '8px 12px', borderRadius: 8, fontSize: 16, border: 'none' }}>
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addSchedule}
              style={{ padding: '8px', borderRadius: 8, background: 'rgba(108,99,255,0.12)', color: 'var(--accent)', fontSize: 13, border: '1px dashed rgba(108,99,255,0.4)' }}>
              + Agregar horario
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button type="button" onClick={onCancel}
            style={{ flex: 1, padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: 14 }}>
            Cancelar
          </button>
          <button type="submit"
            style={{ flex: 2, padding: 12, borderRadius: 10, background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600 }}>
            {initial ? 'Guardar cambios' : 'Agregar medicamento'}
          </button>
        </div>
      </form>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100,
  padding: '0 0 0 0'
};

const modal = {
  background: 'var(--bg-card)',
  borderRadius: '24px 24px 0 0',
  padding: '28px 24px 32px',
  width: '100%',
  maxWidth: 480,
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 -20px 60px rgba(0,0,0,0.5)'
};

const field = { marginBottom: 18 };
const labelStyle = { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' };
const closeBtnStyle = { background: 'rgba(255,255,255,0.07)', border: 'none', color: 'var(--text-muted)', width: 32, height: 32, borderRadius: '50%', fontSize: 14, cursor: 'pointer' };
