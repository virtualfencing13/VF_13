// ─── API Service ─────────────────────────────────────────────────────────────
const BASE = '';   // proxied by Vite → http://127.0.0.1:8000

// Helper to construct JWT authorization headers
export function getAuthHeaders() {
  const token = sessionStorage.getItem('operator_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

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

export async function googleLogin(credential, clientId) {
  const r = await fetch(`${BASE}/api/auth/google-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential, client_id: clientId }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail || 'Google Authentication failed');
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
  const r = await fetch(`${BASE}/api/state?email=${email}`, {
    headers: getAuthHeaders()
  });
  if (!r.ok) throw new Error('Failed to fetch state');
  return r.json();
}

export async function getAlerts() {
  const email = sessionStorage.getItem('operator_email') || '';
  const r = await fetch(`${BASE}/api/alerts?email=${email}`, {
    headers: getAuthHeaders()
  });
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

export async function resetZones(cameraId) {
  const r = await fetch(`${BASE}/api/fence/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cameraId })
  });
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
  const r = await fetch(`${BASE}/api/alerts`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!r.ok) throw new Error('Failed to clear alerts');
  return r.json();
}

export async function deleteAlerts(ids) {
  const r = await fetch(`${BASE}/api/alerts/delete`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
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
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
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
  const r = await fetch(`${BASE}/api/cameras/my`, { headers: getAuthHeaders() });
  if (!r.ok) throw new Error('Failed to fetch cameras');
  const data = await r.json();
  // Support both array structure or wrapped response
  return data.cameras || data;
}

export async function addCamera(payload) {
  const r = await fetch(`${BASE}/api/cameras/create`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const errData = await r.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to add camera');
  }
  return r.json();
}

export async function updateCamera(camId, payload) {
  const r = await fetch(`${BASE}/api/cameras/${camId}`, {
    method: 'PATCH',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('Failed to update camera');
  return r.json();
}

export async function deleteCamera(camId) {
  const r = await fetch(`${BASE}/api/cameras/${camId}`, { 
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!r.ok) throw new Error('Failed to delete camera');
  return r.json();
}

export async function startCameraStream(camId) {
  const r = await fetch(`${BASE}/api/cameras/${camId}/start`, { 
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!r.ok) throw new Error('Failed to start camera');
  return r.json();
}

export async function stopCameraStream(camId) {
  const r = await fetch(`${BASE}/api/cameras/${camId}/stop`, { 
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!r.ok) throw new Error('Failed to stop camera');
  return r.json();
}

// ─── Admin Console API Methods ────────────────────────────────────────────────
export async function getAdminUsers() {
  const r = await fetch(`${BASE}/api/admin/users`, { headers: getAuthHeaders() });
  if (!r.ok) throw new Error('Failed to fetch users list');
  return r.json();
}

export async function adminApproveUser(username, isApproved) {
  const r = await fetch(`${BASE}/api/admin/users/approve`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ username, is_approved: isApproved })
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update user approval status');
  }
  return r.json();
}

export async function adminUpdateUserRole(username, role) {
  const r = await fetch(`${BASE}/api/admin/users/role`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ username, role })
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update user role');
  }
  return r.json();
}

export async function adminDeleteUser(username) {
  const r = await fetch(`${BASE}/api/admin/users/${username}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete user');
  }
  return r.json();
}

export async function getAdminDomains() {
  const r = await fetch(`${BASE}/api/admin/domains`, { headers: getAuthHeaders() });
  if (!r.ok) throw new Error('Failed to fetch allowed domains');
  return r.json();
}

export async function adminAddDomain(domain) {
  const r = await fetch(`${BASE}/api/admin/domains`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ domain })
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to add allowed domain');
  }
  return r.json();
}

export async function adminDeleteDomain(domainId) {
  const r = await fetch(`${BASE}/api/admin/domains/${domainId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete domain');
  }
  return r.json();
}

export async function getAdminLogs() {
  const r = await fetch(`${BASE}/api/admin/logs`, { headers: getAuthHeaders() });
  if (!r.ok) throw new Error('Failed to fetch security logs');
  return r.json();
}

export const VIDEO_FEED_URL = `${BASE}/api/video_feed`;
