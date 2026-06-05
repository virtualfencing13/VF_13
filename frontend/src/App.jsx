import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AlertsPage from './pages/AlertsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CamerasPage from './pages/CamerasPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ReportsPage from './pages/ReportsPage';
import LandingPage from './pages/LandingPage';
import AdminConsolePage from './pages/AdminConsolePage';
import SetupWizard from './components/SetupWizard';
import { getState, getSetupStatus } from './services/api';

function usePWAInstall(isAuthenticated) {
  const [prompt, setPrompt] = useState(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setPrompt(e);
    });
  }, []);

  const install = () => {
    if (prompt) {
      prompt.prompt();
      prompt.userChoice.then(() => setPrompt(null));
    }
  };

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      requestNotificationPermission();
    }
  }, [isAuthenticated, requestNotificationPermission]);

  return { prompt, install };
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem('operator_token'));
  const { prompt, install } = usePWAInstall(isAuthenticated);
  const [metrics, setMetrics] = useState({ fps: '0', latency: '0ms', personCount: 0, intruderCount: 0, person_detection: 'NO', buzzer_status: 'OFF', relay_status: 'ON', motor_status: 'RUNNING' });
  const [status, setStatus] = useState('safe');
  const [latestPriority, setLatestPriority] = useState('low');
  const [alerts, setAlerts] = useState([]);
  const [zones, setZones] = useState([]);
  const [systemActive, setSystemActive] = useState(true);
  const [machineStatus, setMachineStatus] = useState('running');
  const [machineControlEnabled, setMachineControlEnabled] = useState(false);
  const [activeCameraId, setActiveCameraId] = useState('cam_01');
  const [cameras, setCameras] = useState([]);
  const [connected, setConnected] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = (token, email, role, company, name, picture) => {
    sessionStorage.setItem('operator_token', token);
    sessionStorage.setItem('operator_email', email);
    sessionStorage.setItem('operator_role', role || 'operator');
    sessionStorage.setItem('operator_company', company || 'default');
    sessionStorage.setItem('operator_name', name || '');
    sessionStorage.setItem('operator_picture', picture || '');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('operator_token');
    sessionStorage.removeItem('operator_email');
    sessionStorage.removeItem('operator_role');
    sessionStorage.removeItem('operator_company');
    sessionStorage.removeItem('operator_name');
    sessionStorage.removeItem('operator_picture');
    setIsAuthenticated(false);
    navigate('/');
  };

  const fetchState = useCallback(async () => {
    try {
      const email = sessionStorage.getItem('operator_email') || '';
      const data = await getState(email);
      setZones(data.zones ?? []);
      setAlerts(data.alerts ?? []);
      setSystemActive(data.systemActive);
      setMachineStatus(data.machineStatus);
      setMachineControlEnabled(data.machineControlEnabled);
      setActiveCameraId(data.activeCameraId || 'cam_01');
      setCameras(data.cameras ?? []);
      if (data.person_detection) {
        setMetrics(m => ({
          ...m,
          person_detection: data.person_detection,
          buzzer_status: data.buzzer_status,
          relay_status: data.relay_status,
          motor_status: data.motor_status
        }));
      }
      setConnected(true);
      setIsReconnecting(false);
    } catch (err) {
      setConnected(false);
    }
  }, []);

  const checkSetup = async () => {
    try {
      const { setupRequired } = await getSetupStatus();
      setSetupRequired(setupRequired);
    } catch { }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchState();
    checkSetup();

    let ws;
    const connectWS = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsWsConnected(true);
        setIsReconnecting(false);
      };

      ws.onclose = () => {
        setIsWsConnected(false);
        setIsReconnecting(true);
        setTimeout(() => { if (isAuthenticated) connectWS(); }, 5000);
      };

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'update') {
          setStatus(data.status.status);
          setLatestPriority(data.status.priority || 'low');
          setMetrics({
            fps: data.fps,
            latency: data.latency,
            personCount: data.personCount,
            intruderCount: data.intruderCount || 0,
            person_detection: data.person_detection || 'NO',
            buzzer_status: data.buzzer_status || 'OFF',
            relay_status: data.relay_status || 'OFF',
            motor_status: data.motor_status || 'RUNNING'
          });
          setMachineStatus(data.machineStatus);
          setActiveCameraId(data.activeCameraId);
          if (data.zones) setZones(data.zones);
          if (data.cameras) setCameras(data.cameras);

          if (data.intrusion) {
            fetchState();
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('🚨 INTRUSION DETECTED', {
                body: `Breach at ${data.status.message || 'Restricted Zone'}`,
                icon: '/icon-192x192.png',
                tag: 'intrusion-alert',
                renotify: true
              });
            }
            setToast({
              message: `Breach Detected: ${data.status.message || 'Unknown Zone'}`,
              time: new Date().toLocaleTimeString(),
              type: 'intrusion'
            });
            setTimeout(() => setToast(null), 8000);
          }
        }
      };
    };

    connectWS();
    const poll = setInterval(fetchState, 5000);
    return () => {
      if (ws) ws.close();
      clearInterval(poll);
    };
  }, [isAuthenticated, fetchState]);

  // ── Public landing page route (no auth required) ──
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  // ── Authenticated dashboard shell ──
  return (
    <div className="flex h-screen w-full text-white overflow-hidden" style={{background:'var(--black)'}}>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#0d1117',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.05)',
          fontFamily: 'Inter',
          fontSize: '13px',
          fontWeight: 'bold',
          borderRadius: '12px'
        }
      }} />
      {setupRequired && <SetupWizard onComplete={() => setSetupRequired(false)} />}

      {toast && (
        <div className={`fixed top-16 md:top-24 right-4 md:right-10 left-4 md:left-auto z-[200] glass-card p-5 md:p-6 shadow-3xl animate-slidein flex items-center gap-5 backdrop-blur-3xl transition-all duration-500 max-w-md
          ${toast.type === 'intrusion' ? 'border-[var(--danger)] bg-[var(--danger-bg)]' : 'border-[var(--border-em)] bg-[var(--em-glow)]'}`}
          style={{borderWidth:'2px'}}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl shrink-0
             ${toast.type === 'intrusion' ? 'bg-[var(--danger)] text-white animate-pulse' : 'bg-[var(--em)] text-black'}`}>
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="3">
              {toast.type === 'intrusion' ? <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> : <path d="M5 13l4 4L19 7" />}
            </svg>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-50 text-white">{toast.type === 'intrusion' ? 'CRITICAL BREACH' : 'SYSTEM UPDATE'}</span>
            <span className={`text-[14px] font-black mt-1 leading-tight uppercase ${toast.type === 'intrusion' ? 'text-[var(--danger)]' : 'text-[var(--em)]'}`}>{toast.message}</span>
            <span className="text-[9px] font-bold text-muted mt-3 uppercase tracking-widest opacity-40">Forensic Identifier: {toast.time}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-muted hover:text-white transition-colors p-2">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {prompt && (
        <button onClick={install}
          className="fixed bottom-24 md:bottom-8 right-6 bg-[var(--green)] text-black px-6 py-3 rounded-2xl font-black text-xs z-[100] animate-bounce shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center gap-3 uppercase tracking-widest transition-transform hover:scale-110 active:scale-95">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          Install PWA
        </button>
      )}

      <Sidebar 
        onLogout={handleLogout} 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          connected={connected}
          status={status}
          latestPriority={latestPriority}
          isWsConnected={isWsConnected}
          onLogout={handleLogout}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
        <main className="flex-1 overflow-y-auto custom-scrollbar pb-20 md:pb-0">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={
              <Dashboard
                status={{ ...metrics, status, message: status === 'safe' ? 'System Secure' : 'Intrusion Detected' }}
                alerts={alerts}
                zones={zones}
                setZones={setZones}
                connected={connected}
                systemActive={systemActive}
                machineStatus={machineStatus}
                machineControlEnabled={machineControlEnabled}
                activeCameraId={activeCameraId}
                setActiveCameraId={setActiveCameraId}
                isReconnecting={isReconnecting}
                availableCameras={cameras}
              />
            } />
            <Route path="/alerts" element={<AlertsPage alerts={alerts} setAlerts={setAlerts} />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/cameras" element={<CamerasPage cameras={cameras} setCameras={setCameras} />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage connected={connected} />} />
            <Route path="/admin" element={<AdminConsolePage />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
