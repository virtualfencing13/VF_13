import { useState, useEffect } from 'react';
import { setCamera, getSettings, updateSettings, testEmail, testWhatsapp, testSMS, testCall, testTelegram } from '../services/api';

function ToggleSwitch({ enabled, onToggle }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button 
        onClick={onToggle}
        className={`relative w-16 h-8 rounded-full transition-all duration-300 border flex items-center px-1
          ${enabled ? 'bg-[var(--green)]/20 border-[var(--green)]/50' : 'bg-white/5 border-white/10'}`}
      >
        <div className={`w-6 h-6 rounded-full transition-all duration-300 shadow-lg flex items-center justify-center
          ${enabled ? 'translate-x-8 bg-[var(--green)]' : 'translate-x-0 bg-[#484f58]'}`}>
          {enabled && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>}
        </div>
      </button>
      <span className={`text-[8px] font-black uppercase tracking-widest font-[var(--font-mono)] whitespace-nowrap
        ${enabled ? 'text-[var(--green)]' : 'text-[#484f58]'}`}>
        {enabled ? 'STATUS: ACTIVE' : 'STATUS: DISABLED'}
      </span>
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between py-8 border-b border-white/5 last:border-0 gap-6">
      <div className="max-w-md">
        <h3 className="text-[14px] font-extrabold text-white uppercase tracking-tight mb-1 font-[var(--font-display)]">{label}</h3>
        <p className="text-[12px] text-[#8b949e] leading-relaxed font-['Rajdhani']">{description}</p>
      </div>
      <div className="flex items-center gap-12">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage({ connected }) {
  const [config, setConfig] = useState({
    recipientEmail: '',
    emailEnabled: false,
    telegramChatId: '',
    telegramEnabled: false,
    smsEnabled: false,
    smsPhone: '',
    whatsappEnabled: false,
    whatsappRecipients: [], 
    callEnabled: false,
    callPhone: ''
  });
  const [newWA, setNewWA] = useState('');
  const [cameraIdx, setCameraIdx] = useState('0');
  const [saving,    setSaving]    = useState({ general: false, camera: false, test: false, telegram: false });
  const [status,    setStatus]    = useState({ general: '', camera: '', test: '' });

  useEffect(() => {
    const operatorEmail = sessionStorage.getItem('operator_email');
    
    // 1. Load basic settings
    getSettings().then(d => {
      setConfig(prev => ({
        ...prev,
        recipientEmail: d.recipientEmail ?? prev.recipientEmail,
        smsEnabled: d.smsEnabled ?? prev.smsEnabled,
        smsPhone: d.smsPhone ?? prev.smsPhone,
        whatsappEnabled: d.whatsappEnabled ?? prev.whatsappEnabled,
        whatsappRecipients: d.whatsappRecipients ?? prev.whatsappRecipients,
        callEnabled: d.callEnabled ?? prev.callEnabled,
        callPhone: d.callPhone ?? prev.callPhone
      }));
      setCameraIdx(d.cameraSource || '0');
    }).catch(() => {});

    // 2. Load DB notification settings (Context Aware)
    fetch(`/api/settings/notifications?email=${operatorEmail || ''}`)
      .then(r => r.json())
      .then(d => {
        setConfig(prev => ({
          ...prev,
          telegramChatId: d.telegram_chat_id || '',
          telegramEnabled: d.telegram_enabled || false,
          emailEnabled: d.email_enabled || false,
          recipientEmail: d.email || prev.recipientEmail || operatorEmail || ''
        }));
      }).catch(() => {});
  }, []);

  const handleSaveNotificationConfig = async (settings) => {
    setSaving(s => ({...s, telegram: true}));
    const operatorEmail = sessionStorage.getItem('operator_email');
    try {
      const resp = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_context: operatorEmail,
          settings: settings
        })
      });
      if (resp.ok) {
        setStatus(s => ({...s, general: 'Secure Link Synced'}));
        setTimeout(() => setStatus(s => ({...s, general: ''})), 3000);
      }
    } catch {
      setStatus(s => ({...s, general: 'Sync Failure'}));
    } finally {
      setSaving(s => ({...s, telegram: false}));
    }
  };

  const handleUpdateCamera = async () => {
    setSaving(s => ({...s, camera: true})); setStatus(s => ({...s, camera: ''}));
    try {
      await setCamera(cameraIdx);
      setStatus(s => ({...s, camera: 'Stream Updated'}));
      setTimeout(() => setStatus(s => ({...s, camera: ''})), 3000);
    } catch {
      setStatus(s => ({...s, camera: 'Sync Failed'}));
    } finally {
      setSaving(s => ({...s, camera: false}));
    }
  };

  const handleTestChannel = async (channel) => {
    setSaving(s => ({...s, test: true})); setStatus(s => ({...s, test: ''}));
    try {
      let res;
      if (channel === 'email') res = await testEmail();
      else if (channel === 'telegram') {
        res = await fetch('/api/settings/test-telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: config.telegramChatId })
        }).then(r => r.json());
      }

      setStatus(s => ({...s, test: `Signal Sent (${channel.toUpperCase()})`}));
      setTimeout(() => setStatus(s => ({...s, test: ''})), 4000);
    } catch {
      setStatus(s => ({...s, test: 'Comms Error'}));
      setTimeout(() => setStatus(s => ({...s, test: ''})), 4000);
    } finally {
      setSaving(s => ({...s, test: false}));
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto flex flex-col gap-6 md:gap-10 animate-fadein relative font-['Rajdhani']">
      
      {/* Page Header */}
      <div className="flex flex-col">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter font-[var(--font-display)]">Settings</h1>
        <p className="text-[12px] font-bold text-[#8b949e] uppercase tracking-wider mt-2 font-[var(--font-mono)]">Manage your notifications and cameras</p>
      </div>

      <div className="grid gap-8">
        
        {/* Notification Section */}
        <div className="industrial-card overflow-hidden">
          <div className="px-8 py-5 border-b border-white/5 bg-white/2 flex items-center justify-between">
            <span className="text-[11px] font-bold text-white uppercase tracking-widest font-[var(--font-display)]">Notifications</span>
          </div>
          <div className="px-8">
            
            {/* Email Channel */}
            <SettingRow 
              label="Incident Email" 
              description="Dispatch high-resolution snapshots to security operators via secure SMTP."
            >
              <div className="flex items-center gap-6">
                <input 
                  type="email" 
                  value={config.recipientEmail}
                  onChange={e => setConfig({...config, recipientEmail: e.target.value})}
                  className="input h-11 w-56 bg-black/40 border-white/10 text-white font-[var(--font-mono)] text-sm"
                  placeholder="operator@oasis-core.com"
                />
                <ToggleSwitch 
                  enabled={config.emailEnabled}
                  onToggle={() => {
                    const next = !config.emailEnabled;
                    setConfig({...config, emailEnabled: next});
                    handleSaveNotificationConfig({ email_enabled: next, email: config.recipientEmail });
                  }}
                />
                <button 
                  className="btn-primary h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[var(--green)] text-black" 
                  disabled={saving.telegram}
                  onClick={() => handleSaveNotificationConfig({ email: config.recipientEmail, email_enabled: config.emailEnabled })}
                >
                  {saving.telegram ? '...' : 'SAVE'}
                </button>
              </div>
            </SettingRow>

            {/* Telegram Channel */}
            <SettingRow 
              label="Telegram Alerts" 
              description="Receive alerts via Telegram. Click 'LINK BOT' to connect your device."
            >
              <div className="flex items-center gap-6">
                {config.telegramChatId ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-[var(--green)]/10 border border-[var(--green)]/30 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
                    <span className="text-[9px] font-black text-[var(--green)] uppercase tracking-widest font-[var(--font-mono)]">SECURE LINKED</span>
                  </div>
                ) : (
                  <a 
                    href={`https://t.me/fence_ai_bot?start=${sessionStorage.getItem('operator_email') || ''}`}
                    target="_blank" 
                    rel="noreferrer"
                    className="h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#0088cc] text-white flex items-center hover:opacity-90 transition-all shadow-[0_0_15px_rgba(0,136,204,0.3)]"
                  >
                    🔗 LINK BOT
                  </a>
                )}

                <ToggleSwitch 
                  enabled={config.telegramEnabled}
                  onToggle={() => {
                    const next = !config.telegramEnabled;
                    setConfig({...config, telegramEnabled: next});
                    handleSaveNotificationConfig({ telegram_enabled: next, telegram_chat_id: config.telegramChatId });
                  }}
                />

                <button 
                  className="h-11 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all" 
                  onClick={() => handleTestChannel('telegram')}
                  disabled={!config.telegramChatId}
                >
                  TEST
                </button>
              </div>
            </SettingRow>

          </div>
        </div>

        {/* Hardware Section */}
        <div className="industrial-card overflow-hidden">
          <div className="px-8 py-5 border-b border-white/5 bg-white/2 flex items-center justify-between">
            <span className="text-[11px] font-bold text-white uppercase tracking-widest font-[var(--font-display)]">Camera Settings</span>
          </div>
          <div className="px-8">
            <SettingRow 
              label="Camera Source" 
              description="Enter '0' for the built-in webcam, or an RTSP link for an IP camera."
            >
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-3">
                  <input 
                    type="text" 
                    value={cameraIdx}
                    onChange={e => setCameraIdx(e.target.value)}
                    className="input h-11 w-64 md:w-80 bg-black/40 border-white/10 text-white font-[var(--font-mono)] text-sm"
                    placeholder="e.g. 0 or rtsp://..."
                  />
                  <button 
                    className="btn-secondary h-11 px-8 rounded-xl shrink-0 text-[10px] font-black uppercase bg-white/5 hover:bg-white/10 border border-white/10" 
                    disabled={saving.camera}
                    onClick={handleUpdateCamera}
                  >
                    {saving.camera ? 'LINKING...' : 'CONNECT'}
                  </button>
                </div>
              </div>
            </SettingRow>

            <SettingRow 
              label="Server Connection" 
              description="Status of the connection to the backend server."
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-[var(--green)] pulse-ring' : 'bg-[var(--color-red)]'}`} />
                <span className={`text-[11px] font-bold uppercase tracking-widest font-[var(--font-mono)] ${connected ? 'text-[var(--green)]' : 'text-[var(--color-red)]'}`}>
                  {connected ? 'CONNECTED' : 'DISCONNECTED'}
                </span>
              </div>
            </SettingRow>
          </div>
        </div>

      </div>

      <div className="flex justify-center mt-6">
         <p className="text-[10px] font-bold text-[#484f58] uppercase tracking-widest font-[var(--font-mono)]">Virtual Fencing System</p>
      </div>

    </div>
  );
}
