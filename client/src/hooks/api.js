const BASE = '/api';

export async function getMedications() {
  const res = await fetch(`${BASE}/medications`);
  return res.json();
}

export async function addMedication(med) {
  const res = await fetch(`${BASE}/medications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(med)
  });
  return res.json();
}

export async function updateMedication(id, med) {
  const res = await fetch(`${BASE}/medications/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(med)
  });
  return res.json();
}

export async function deleteMedication(id) {
  const res = await fetch(`${BASE}/medications/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function getVapidKey() {
  const res = await fetch(`${BASE}/vapid-key`);
  const data = await res.json();
  return data.publicKey;
}

export async function saveSubscription(sub) {
  const res = await fetch(`${BASE}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub)
  });
  return res.json();
}

export async function testNotify() {
  const res = await fetch(`${BASE}/test-notify`, { method: 'POST' });
  return res.json();
}

export async function getDebugInfo() {
  const res = await fetch(`${BASE}/debug`);
  return res.json();
}

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}
