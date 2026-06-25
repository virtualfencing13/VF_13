import { useState, useEffect } from 'react';
import { getSettings, updateSettings, testEmail, testTelegram, toggleMachineControl } from '../services/api';
import toast from 'react-hot-toast';

function ToggleSwitch({ enabled, onToggle, label }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button 
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onToggle();
        }}
        className={`relative w-14 h-7 rounded-full transition-all duration-500 border flex items-center px-1
          ${enabled ? 'bg-[var(--em)]/20 border-[var(--em)]/50' : 'bg-white/5 border-white/10'}`}
      >
        <div className={`w-5 h-5 rounded-full transition-all duration-500 shadow-xl flex items-center justify-center
          ${enabled ? 'translate-x-7 bg-[var(--em)]' : 'translate-x-0 bg-[#484f58]'}`}>
          {enabled && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>}
        </div>
      </button>
      {label && <span className={`text-[8px] font-black uppercase tracking-widest ${enabled ? 'text-[var(--em)]' : 'text-muted'}`}>{label}</span>}
    </div>
  );
}

export default function SettingsPage({ connected }) {
  const [userData, setUserData] = useState({
    fullName: 'Authorized Operator',
    role: 'Level 1: Operator',
    company: 'Industrial Facility',
    email: sessionStorage.getItem('operator_email') || ''
  });

  const [config, setConfig] = useState({
    recipientEmails: [],  // Changed to array
    emailEnabled: false,
    telegramChatId: '',
    telegramEnabled: false,
    confidenceThreshold: 0.5,
    alertCooldown: 30,
    machineControlEnabled: false,
    phone: '',
    smsEnabled: false,
    callEnabled: false,
    whatsappNumber: '',
    whatsappEnabled: false
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const operatorEmail = sessionStorage.getItem('operator_email');
    
    // Fetch profile
    if (operatorEmail) {
      fetch(`/api/auth/profile?email=${operatorEmail}`)
        .then(r => r.json())
        .then(d => {
          if (d.success) setUserData({
            fullName: d.user.full_name || 'Authorized Operator',
            role: d.user.role || 'Level 1: Operator',
            company: d.user.company || 'Industrial Facility',
            email: d.user.username
          });
        }).catch(() => {});
    }

    // Load settings
    getSettings().then(d => {
      setConfig(prev => ({
        ...prev,
        confidenceThreshold: d.confidenceThreshold || 0.5,
        alertCooldown: d.cooldownSeconds || 30
      }));
    }).catch(() => {});

    // Load notifications
    fetch(`/api/settings/notifications?email=${operatorEmail || ''}`)
      .then(r => r.json())
      .then(d => {
        const emails = [];
        // Collect emails from both 'emails' (new) and 'email' (old) fields
        if (d.emails) {
          emails.push(...d.emails.split(',').map(e => e.trim()).filter(e => e));
        }
        if (d.email && !emails.includes(d.email)) {
          emails.push(d.email);
        }
        if (operatorEmail && !emails.includes(operatorEmail)) {
          emails.unshift(operatorEmail);
        }
        
        setConfig(prev => ({
          ...prev,
          telegramChatId: d.telegram_chat_id || '',
          telegramEnabled: d.telegram_enabled || false,
          emailEnabled: d.email_enabled || false,
          recipientEmails: emails,
          phone: d.phone || '',
          smsEnabled: d.sms_enabled || false,
          callEnabled: d.call_enabled || false,
          whatsappNumber: d.whatsapp_number || '',
          whatsappEnabled: d.whatsapp_enabled || false
        }));
      }).catch(() => {});

    // Load machine status
    fetch('/api/state')
      .then(r => r.json())
      .then(d => {
        setConfig(prev => ({ ...prev, machineControlEnabled: d.machineControlEnabled }));
      }).catch(() => {});
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);
    const operatorEmail = sessionStorage.getItem('operator_email');
    try {
      // 1. Save Notifications
      await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_context: operatorEmail,
          settings: {
            email_enabled: config.emailEnabled,
            email: config.recipientEmails[0] || '',  // Primary email for backward compatibility
            emails: config.recipientEmails.join(','),  // All emails comma-separated
            telegram_enabled: config.telegramEnabled,
            telegram_chat_id: config.telegramChatId,
            phone: config.phone || '',
            sms_enabled: config.smsEnabled,
            call_enabled: config.callEnabled,
            whatsapp_number: config.whatsappNumber || '',
            whatsapp_enabled: config.whatsappEnabled
          }
        })
      });

      // 2. Save Machine Toggle
      await toggleMachineControl(config.machineControlEnabled);

      // 3. Save AI Settings (if backend supported specific thresholds via POST /api/settings)
      await updateSettings({
        recipientEmail: config.recipientEmails.join(','),
        confidenceThreshold: config.confidenceThreshold,
        cooldownSeconds: config.alertCooldown
      });

      toast.success('Configuration Synchronized Successfully');
    } catch {
      toast.error('Synchronization Protocol Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto flex flex-col gap-10 animate-fadein font-['Inter']">
      
      {/* Profile Header */}
      <div className="glass-card p-10 border border-white/10 bg-white/[0.02] flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--em)]/5 rounded-full blur-[80px]" />
        
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-[var(--em)] to-[#2eff88] p-1.5 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
          <div className="w-full h-full rounded-[22px] bg-[#0d1117] flex items-center justify-center">
             <span className="text-5xl font-black text-[var(--em)]">{userData.fullName.charAt(0)}</span>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
           <h2 className="text-4xl font-black text-white uppercase tracking-tight leading-none mb-2">{userData.fullName}</h2>
           <span className="text-[11px] font-black text-[var(--em)] uppercase tracking-[0.4em] block mb-6">{userData.role} // {userData.company}</span>
           
           <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
                 <svg width="16" height="16" fill="none" stroke="var(--em)" strokeWidth="2.5"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                 <span className="text-[11px] font-bold text-white/60 font-mono">{userData.email}</span>
              </div>
              <div className="px-4 py-2 bg-[var(--em)]/10 border border-[var(--em)]/20 rounded-xl flex items-center gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-[var(--em)] animate-pulse" />
                 <span className="text-[10px] font-black text-[var(--em)] uppercase tracking-widest">Access: Node_Verified</span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Main Settings Panel */}
        <div className="lg:col-span-2 space-y-10">
           
           {/* Notification Matrix */}
           <div className="glass-card overflow-hidden border border-white/5 bg-white/[0.02]">
              <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
                 <div className="w-1.5 h-5 bg-[var(--em)]" />
                 <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Notification Protocols</span>
              </div>
              
              <div className="p-10 space-y-10">
                 <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                    <div className="max-w-md">
                       <span className="text-sm font-black text-white uppercase tracking-tight block mb-1">Email Alert Dispatch</span>
                       <p className="text-[11px] font-medium text-muted leading-relaxed">Broadcast forensic snapshots and intrusion data to multiple recipients.</p>
                    </div>
                    <div className="flex flex-col gap-4 flex-1 min-w-[240px]">
                       {config.recipientEmails.map((email, idx) => {
                          const isMainEmail = email === userData.email;
                          return (
                            <div key={idx} className="flex gap-2 items-center">
                              <input 
                                type="email" 
                                className="flex-1 h-12 px-5 rounded-xl bg-black border border-white/10 text-white font-mono text-xs focus:border-[var(--em)] transition-all disabled:opacity-60"
                                value={email}
                                disabled={isMainEmail}
                                onChange={e => {
                                  const newEmails = [...config.recipientEmails];
                                  newEmails[idx] = e.target.value;
                                  setConfig({...config, recipientEmails: newEmails});
                                }}
                              />
                              {!isMainEmail && (
                                <button
                                  onClick={() => {
                                    const newEmails = config.recipientEmails.filter((_, i) => i !== idx);
                                    setConfig({...config, recipientEmails: newEmails});
                                  }}
                                  className="h-12 w-12 rounded-xl bg-red-500/20 border border-red-500/30 text-red-500 flex items-center justify-center hover:bg-red-500/30 transition-all"
                                >
                                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6H0M16 6l-1.4 12.6c-.2 1.1-1.1 1.9-2.2 1.9H5.6c-1.1 0-2-.8-2.2-1.9L2 6M7 10v8M12 10v8"/>
                                  </svg>
                                </button>
                              )}
                            </div>
                          );
                        })}
                       <button
                         onClick={() => setConfig({...config, recipientEmails: [...config.recipientEmails, '']})}
                         className="h-12 px-5 rounded-xl bg-[var(--em)]/20 border border-[var(--em)]/50 text-[var(--em)] font-black text-sm uppercase flex items-center justify-center gap-2 hover:bg-[var(--em)]/30 transition-all"
                       >
                         <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                           <path d="M8 2v12M2 8h12"/>
                         </svg>
                         Add Email
                       </button>
                    </div>
                    <ToggleSwitch 
                       enabled={config.emailEnabled}
                       onToggle={() => setConfig(prev => ({...prev, emailEnabled: !prev.emailEnabled}))}
                    />
                 </div>

                 <div className="h-[1px] bg-white/5" />

                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="max-w-md">
                       <span className="text-sm font-black text-white uppercase tracking-tight block mb-1">Telegram Secure Link</span>
                       <p className="text-[11px] font-medium text-muted leading-relaxed">Instant edge-to-mobile transmission via private bot protocol.</p>
                    </div>
                    <div className="flex items-center gap-8">
                       <div className="flex-1 min-w-[240px]">
                          {config.telegramChatId ? (
                            <div className="h-12 flex items-center px-5 bg-[var(--em)]/10 border border-[var(--em)]/20 rounded-xl text-[var(--em)] font-black text-[10px] uppercase tracking-widest">
                               <div className="w-1.5 h-1.5 rounded-full bg-[var(--em)] mr-3 animate-pulse" />
                               Linked: {config.telegramChatId}
                            </div>
                          ) : (
                            <a href={`https://t.me/fence_ai_bot?start=${userData.email}`} target="_blank" className="h-12 px-6 bg-[#0088cc] text-white rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,136,204,0.3)] transition-all">
                               Initialize Link
                            </a>
                          )}
                       </div>
                       <ToggleSwitch 
                        enabled={config.telegramEnabled}
                        onToggle={() => setConfig(prev => ({...prev, telegramEnabled: !prev.telegramEnabled}))}
                       />
                    </div>
                 </div>

                 <div className="h-[1px] bg-white/5" />

                 <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                    <div className="max-w-md">
                       <span className="text-sm font-black text-white uppercase tracking-tight block mb-1">Twilio Safety Dispatch (Call & SMS)</span>
                       <p className="text-[11px] font-medium text-muted leading-relaxed">Direct carrier interlock alerts. Voice calls are limited to 1 call per intrusion event to avoid spamming.</p>
                    </div>
                    <div className="flex flex-col gap-4 flex-1 min-w-[240px]">
                       <input 
                         type="tel" 
                         placeholder="Primary Phone (+1234567890)"
                         className="w-full h-12 px-5 rounded-xl bg-black border border-white/10 text-white font-mono text-xs focus:border-[var(--em)] transition-all"
                         value={config.phone || ''}
                         onChange={e => setConfig({...config, phone: e.target.value})}
                       />
                       <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                         <span className="text-[10px] font-bold text-white/60 uppercase">Enable SMS Alerts</span>
                         <ToggleSwitch 
                           enabled={config.smsEnabled}
                           onToggle={() => setConfig(prev => ({...prev, smsEnabled: !prev.smsEnabled}))}
                         />
                       </div>
                       <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                         <span className="text-[10px] font-bold text-white/60 uppercase">Enable Voice Call Alerts</span>
                         <ToggleSwitch 
                           enabled={config.callEnabled}
                           onToggle={() => setConfig(prev => ({...prev, callEnabled: !prev.callEnabled}))}
                         />
                       </div>
                    </div>
                 </div>

                 <div className="h-[1px] bg-white/5" />

                 <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                    <div className="max-w-md">
                       <span className="text-sm font-black text-white uppercase tracking-tight block mb-1">WhatsApp Broadcast Link</span>
                       <p className="text-[11px] font-medium text-muted leading-relaxed">Industrial security streaming alerts and visual reports to WhatsApp targets.</p>
                    </div>
                    <div className="flex flex-col gap-4 flex-1 min-w-[240px]">
                       <input 
                         type="tel" 
                         placeholder="WhatsApp Target (+1234567890)"
                         className="w-full h-12 px-5 rounded-xl bg-black border border-white/10 text-white font-mono text-xs focus:border-[var(--em)] transition-all"
                         value={config.whatsappNumber || ''}
                         onChange={e => setConfig({...config, whatsappNumber: e.target.value})}
                       />
                       <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                         <span className="text-[10px] font-bold text-white/60 uppercase">Enable WhatsApp Stream</span>
                         <ToggleSwitch 
                           enabled={config.whatsappEnabled}
                           onToggle={() => setConfig(prev => ({...prev, whatsappEnabled: !prev.whatsappEnabled}))}
                         />
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* AI & Logic Parameters */}
           <div className="glass-card overflow-hidden border border-white/5 bg-white/[0.02]">
              <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
                 <div className="w-1.5 h-5 bg-[var(--em)]" />
                 <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Neural Logic Parameters</span>
              </div>
              
              <div className="p-10 space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                       <div className="flex justify-between items-center">
                          <span className="text-[11px] font-black text-white uppercase tracking-widest">Inference Threshold</span>
                          <span className="text-[11px] font-black text-[var(--em)] font-mono">{Math.round(config.confidenceThreshold * 100)}%</span>
                       </div>
                       <input 
                        type="range" min="0.1" max="0.95" step="0.05"
                        className="w-full accent-[var(--em)] bg-white/5 rounded-lg h-1.5"
                        value={config.confidenceThreshold}
                        onChange={e => setConfig({...config, confidenceThreshold: parseFloat(e.target.value)})}
                       />
                       <p className="text-[9px] font-bold text-muted uppercase tracking-widest leading-relaxed">Minimum probability required for target classification.</p>
                    </div>

                    <div className="space-y-4">
                       <div className="flex justify-between items-center">
                          <span className="text-[11px] font-black text-white uppercase tracking-widest">Alert Dwell Delay</span>
                          <span className="text-[11px] font-black text-[var(--em)] font-mono">{config.alertCooldown}s</span>
                       </div>
                       <input 
                        type="range" min="5" max="300" step="5"
                        className="w-full accent-[var(--em)] bg-white/5 rounded-lg h-1.5"
                        value={config.alertCooldown}
                        onChange={e => setConfig({...config, alertCooldown: parseInt(e.target.value)})}
                       />
                       <p className="text-[9px] font-bold text-muted uppercase tracking-widest leading-relaxed">Suppression window between consecutive security alerts.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-8">
           <div className="glass-card p-8 border border-white/5 bg-white/[0.02] flex flex-col gap-6">
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-4 bg-[var(--danger)]" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Fail-Safe Protocols</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                 <div className="flex flex-col">
                    <span className="text-[11px] font-black text-white uppercase tracking-tight">Machine Stop</span>
                    <span className="text-[9px] font-bold text-muted uppercase mt-1">Instant hardware kill</span>
                 </div>
                 <ToggleSwitch 
                  enabled={config.machineControlEnabled}
                  onToggle={() => setConfig(prev => ({...prev, machineControlEnabled: !prev.machineControlEnabled}))}
                 />
              </div>

              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex flex-col gap-2">
                 <span className="text-[9px] font-black text-[var(--danger)] uppercase tracking-widest">Critical Alert</span>
                 <p className="text-[9px] font-medium text-white/40 leading-relaxed uppercase">Machine Stop logic will trigger an immediate shutdown of all connected PLC nodes upon danger zone breach.</p>
              </div>
           </div>

           <button 
            disabled={saving}
            onClick={handleSaveAll}
            className="w-full h-16 bg-[var(--em)] text-black rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-[0_0_40px_rgba(16,185,129,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
           >
             {saving ? 'Synchronizing...' : 'Apply Global Changes'}
           </button>
           <p className="text-center text-[9px] font-black text-muted uppercase tracking-[0.4em] opacity-40 italic">Industrial Node: oasis-v2.4</p>
        </div>

      </div>
    </div>
  );
}
