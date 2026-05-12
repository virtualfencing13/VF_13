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
  const [metrics, setMetrics] = useState({ fps: '0', latency: '0ms', personCount: 0, intruderCount: 0 });
  const [status, setStatus] = useState('safe');
  const [latestPriority, setLatestPriority] = useState('low');
  const [alerts, setAlerts] = useState([]);
  const [zones, setZones] = useState([]);
  const [systemActive, setSystemActive] = useState(true);
  const [machineStatus, setMachineStatus] = useState('running');
  const [machineControlEnabled, setMachineControlEnabled] = useState(false);
  const [activeCameraId, setActiveCameraId] = useState('cam_01');
  const [connected, setConnected] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();

  const handleLogin = (email) => {
    sessionStorage.setItem('operator_token', 'secure-session-' + Date.now());
    sessionStorage.setItem('operator_email', email);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('operator_token');
    sessionStorage.removeItem('operator_email');
    setIsAuthenticated(false);
    navigate('/login');
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
      const wsUrl = `ws://${window.location.hostname}:8000/api/ws`;
      ws = new WebSocket(wsUrl);

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
            intruderCount: data.intruderCount || 0
          });
          setMachineStatus(data.machineStatus);
          setActiveCameraId(data.activeCameraId);
          if (data.zones) setZones(data.zones); // Update zones (includes cooldown)

          if (data.intrusion) {
            fetchState(); // Refresh alerts on intrusion

            // Native Browser Notification (PWA)
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

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#05070a] text-white overflow-hidden">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#0d1117',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.05)',
          fontFamily: 'Rajdhani',
          fontSize: '13px',
          fontWeight: 'bold',
          borderRadius: '12px'
        }
      }} />
      {/* ── First Run Setup ────────────────────────────────────────── */}
      {setupRequired && <SetupWizard onComplete={() => setSetupRequired(false)} />}

      {/* ── High Priority Toast Notification ───────────────────────── */}
      {toast && (
        <div className={`fixed top-16 md:top-24 right-3 md:right-8 left-3 md:left-auto z-[200] border p-3 md:p-5 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-slidein flex items-center gap-3 md:gap-5 backdrop-blur-xl transition-all duration-500 font-['Rajdhani']
          ${toast.type === 'intrusion' ? 'bg-[var(--color-red)]/10 border-[var(--color-red)]/40' : 'bg-[var(--green)]/10 border-[var(--green)]/40'}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg
             ${toast.type === 'intrusion' ? 'bg-[var(--color-red)] text-black animate-pulse' : 'bg-[var(--green)] text-black'}`}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3">
              {toast.type === 'intrusion' ? <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> : <path d="M5 13l4 4L19 7" />}
            </svg>
          </div>
          <div className="flex flex-col min-w-[200px]">
            <span className="text-[12px] font-black text-white uppercase tracking-widest font-[var(--font-display)]">{toast.type === 'intrusion' ? 'CRITICAL BREACH' : 'SYSTEM UPDATE'}</span>
            <span className={`text-[13px] font-bold mt-0.5 ${toast.type === 'intrusion' ? 'text-[var(--color-red)]' : 'text-[var(--green)]'}`}>{toast.message}</span>
            <span className="text-[9px] text-[#8b949e] font-[var(--font-mono)] mt-2 uppercase tracking-tighter">Forensic Sync: {toast.time}</span>
          </div>
          <button onClick={() => setToast(null)} className="ml-4 text-[#484f58] hover:text-white transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* ── PWA Install Prompt ────────────────────────────────────── */}
      {prompt && (
        <button
          onClick={install}
          className="fixed bottom-24 md:bottom-8 right-6 bg-[var(--green)] text-black 
                     px-6 py-3 rounded-2xl font-black text-xs z-[100] font-[var(--font-display)]
                     animate-bounce shadow-[0_0_30px_rgba(0,255,65,0.4)] flex items-center gap-3 uppercase tracking-widest transition-transform hover:scale-110 active:scale-95"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          Install PWA
        </button>
      )}

      {/* ── Left Sidebar ────────────────────────────────────────────── */}
      <Sidebar onLogout={handleLogout} />

      {/* ── Main Content Area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        <Navbar
          connected={connected}
          status={status}
          latestPriority={latestPriority}
          isWsConnected={isWsConnected}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar pb-20 md:pb-0">
          <Routes>
            <Route path="/" element={
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
                isReconnecting={isReconnecting}
              />
            } />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/cameras" element={<CamerasPage />} />
            <Route path="/settings" element={<SettingsPage connected={connected} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

      </div>
    </div>
  );
}
