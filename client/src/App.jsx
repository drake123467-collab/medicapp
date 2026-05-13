import React, { useState, useEffect, useCallback } from 'react';
import MedicationCard from './components/MedicationCard';
import MedicationForm from './components/MedicationForm';
import NotificationsPanel from './components/NotificationsPanel';
import TodayView from './components/TodayView';
import { getMedications, addMedication, updateMedication, deleteMedication } from './hooks/api';

const TABS = [
  { id: 'today', label: '📋 Hoy', icon: '📋' },
  { id: 'meds', label: '💊 Medicamentos', icon: '💊' },
  { id: 'settings', label: '⚙️ Config.', icon: '⚙️' },
];

export default function App() {
  const [tab, setTab] = useState('today');
  const [medications, setMedications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editMed, setEditMed] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const meds = await getMedications();
      setMedications(meds);
    } catch (e) {
      console.error('Error cargando medicamentos:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  async function handleSave(data) {
    if (editMed) {
      await updateMedication(editMed.id, data);
    } else {
      await addMedication(data);
    }
    setShowForm(false);
    setEditMed(null);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este medicamento?')) return;
    await deleteMedication(id);
    load();
  }

  async function handleToggle(med) {
    await updateMedication(med.id, { active: !med.active });
    load();
  }

  function handleEdit(med) {
    setEditMed(med);
    setShowForm(true);
  }

  const activeMeds = medications.filter(m => m.active).length;

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px',
        background: 'linear-gradient(180deg, rgba(108,99,255,0.12) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 10,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
              MedicApp
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
              {activeMeds} medicamento{activeMeds !== 1 ? 's' : ''} activo{activeMeds !== 1 ? 's' : ''}
            </p>
          </div>
          {tab === 'meds' && (
            <button onClick={() => { setEditMed(null); setShowForm(true); }}
              style={{
                padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: 'var(--accent)', color: '#fff'
              }}>
              + Nuevo
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '20px 16px 100px', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {tab === 'today' && <TodayView medications={medications} />}

            {tab === 'meds' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {medications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: 40, marginBottom: 12 }}>💊</p>
                    <p style={{ fontSize: 15, marginBottom: 8 }}>No hay medicamentos cargados.</p>
                    <button onClick={() => setShowForm(true)}
                      style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600 }}>
                      + Agregar el primero
                    </button>
                  </div>
                ) : medications.map(med => (
                  <MedicationCard key={med.id} med={med}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle} />
                ))}
              </div>
            )}

            {tab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Notificaciones y alarmas</h2>
                  <NotificationsPanel />
                </div>

                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '16px 18px' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>📱 Instalar en celular</h3>
                  <ol style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8, paddingLeft: 18 }}>
                    <li>Abrí esta página en <strong style={{ color: 'var(--text)' }}>Chrome</strong> en Android</li>
                    <li>Tocá el menú <strong style={{ color: 'var(--text)' }}>⋮</strong> arriba a la derecha</li>
                    <li>Seleccioná <strong style={{ color: 'var(--text)' }}>"Añadir a pantalla de inicio"</strong></li>
                    <li>Aceptá y la app se instalará como si fuera nativa</li>
                    <li>Activá las notificaciones desde la app instalada</li>
                  </ol>
                </div>

                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', padding: '16px 18px' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>ℹ️ Acerca de MedicApp</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    Las alarmas se envían desde el servidor cada minuto.<br />
                    El celular recibirá la notificación aunque la pantalla esté apagada o la app esté cerrada.<br />
                    Cada dispositivo debe activar las notificaciones por separado.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: 'rgba(13,13,26,0.92)', backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border)',
        display: 'flex', padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
        zIndex: 20
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '8px 0', background: 'none', border: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3
            }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{
              fontSize: 10, fontFamily: 'var(--font-mono)',
              color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)',
              transition: 'color 0.15s'
            }}>
              {t.id === 'today' ? 'HOY' : t.id === 'meds' ? 'MEDS' : 'CONFIG'}
            </span>
            {tab === t.id && (
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', position: 'absolute', bottom: 'max(8px, env(safe-area-inset-bottom))' }} />
            )}
          </button>
        ))}
      </div>

      {/* Medication Form Modal */}
      {showForm && (
        <MedicationForm
          initial={editMed}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditMed(null); }}
        />
      )}
    </div>
  );
}
