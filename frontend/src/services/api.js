// ─── API Service ─────────────────────────────────────────────────────────────
const BASE = '';   // proxied by Vite → http://127.0.0.1:8000

export async function login(username, password) {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail || 'Login failed');
  }
  return r.json();
}

export async function register(payload) {
  const r = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail || 'Registration failed');
  }
  return r.json();
}

export async function getState(email = "") {
  const r = await fetch(`${BASE}/api/state?email=${email}`);
  if (!r.ok) throw new Error('Failed to fetch state');
  return r.json();
}

export async function getAlerts() {
  const r = await fetch(`${BASE}/api/alerts`);
  if (!r.ok) throw new Error('Failed to fetch alerts');
  return r.json();
}

export async function postZones(zones, cameraId) {
  const r = await fetch(`${BASE}/api/fence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zones, cameraId }),
  });
  if (!r.ok) throw new Error('Failed to update zones');
  return r.json();
}

export async function toggleMachineControl(enabled) {
  const r = await fetch(`${BASE}/api/machine/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  if (!r.ok) throw new Error('Failed to toggle machine control');
  return r.json();
}

export async function resetMachine() {
  const r = await fetch(`${BASE}/api/machine/reset`, { method: 'POST' });
  if (!r.ok) throw new Error('Failed to reset machine');
  return r.json();
}

export async function resetZones() {
  const r = await fetch(`${BASE}/api/fence/reset`, { method: 'POST' });
  if (!r.ok) throw new Error('Failed to reset zones');
  return r.json();
}

export async function setCamera(cameraId) {
  const r = await fetch(`${BASE}/api/camera`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cameraId }),
  });
  if (!r.ok) throw new Error('Failed to set camera');
  return r.json();
}

export async function getHealth() {
  const r = await fetch(`${BASE}/api/health`);
  if (!r.ok) throw new Error('Backend unreachable');
  return r.json();
}

export async function getSettings() {
  const r = await fetch(`${BASE}/api/settings`);
  if (!r.ok) throw new Error('Failed to fetch settings');
  return r.json();
}

export async function updateSettings(payload) {
  const r = await fetch(`${BASE}/api/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update settings');
  }
  return r.json();
}

export async function toggleSystem(active) {
  const r = await fetch(`${BASE}/api/system/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active }),
  });
  if (!r.ok) throw new Error('Failed to toggle system');
  return r.json();
}

export async function clearAlerts() {
  const r = await fetch(`${BASE}/api/alerts`, { method: 'DELETE' });
  if (!r.ok) throw new Error('Failed to clear alerts');
  return r.json();
}

export async function deleteAlerts(ids) {
  const r = await fetch(`${BASE}/api/alerts/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!r.ok) throw new Error('Failed to delete selected alerts');
  return r.json();
}

export async function saveAlertConfig(payload) {
  const r = await fetch(`${BASE}/api/save-alert-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('Failed to save alert config');
  return r.json();
}

export async function testEmail() {
  const r = await fetch(`${BASE}/api/alerts/test-email`, { method: 'POST' });
  if (!r.ok) throw new Error('Failed to send test email');
  return r.json();
}

export async function testWhatsapp() {
  const r = await fetch(`${BASE}/api/alerts/test-whatsapp`, { method: 'POST' });
  if (!r.ok) throw new Error('Failed to send test WhatsApp');
  return r.json();
}

export async function testSMS() {
  const r = await fetch(`${BASE}/api/alerts/test-sms`, { method: 'POST' });
  if (!r.ok) throw new Error('Failed to send test SMS');
  return r.json();
}

export async function testCall() {
  const r = await fetch(`${BASE}/api/alerts/test-call`, { method: 'POST' });
  if (!r.ok) throw new Error('Failed to send test Call');
  return r.json();
}

export async function testTelegram() {
  const r = await fetch(`${BASE}/api/alerts/test-telegram`, { method: 'POST' });
  if (!r.ok) throw new Error('Failed to send test Telegram');
  return r.json();
}

export async function acknowledgeAlert(id, acknowledged = true) {
  const r = await fetch(`${BASE}/api/alerts/acknowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, acknowledged }),
  });
  if (!r.ok) throw new Error('Failed to acknowledge alert');
  return r.json();
}

export async function changePassword(password) {
  const r = await fetch(`${BASE}/api/auth/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!r.ok) throw new Error('Failed to change password');
  return r.json();
}

export async function getSetupStatus() {
  const r = await fetch(`${BASE}/api/setup/status`);
  if (!r.ok) throw new Error('Failed to fetch setup status');
  return r.json();
}

export async function getCameras() {
  const r = await fetch(`${BASE}/api/cameras`);
  if (!r.ok) throw new Error('Failed to fetch cameras');
  return r.json();
}

export async function addCamera(payload) {
  const r = await fetch(`${BASE}/api/cameras`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('Failed to add camera');
  return r.json();
}

export async function deleteCamera(camId) {
  const r = await fetch(`${BASE}/api/cameras/${camId}`, { method: 'DELETE' });
  if (!r.ok) throw new Error('Failed to delete camera');
  return r.json();
}

export const VIDEO_FEED_URL = `${BASE}/api/video_feed`;
