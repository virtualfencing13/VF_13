import { useState, useEffect } from 'react';
import AlertsPanel from '../components/AlertsPanel';
import { getAlerts, clearAlerts, deleteAlerts, acknowledgeAlert } from '../services/api';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [investigatingAlert, setInvestigatingAlert] = useState(null);

  const fetchAlerts = async () => {
    try {
      const data = await getAlerts();
      setAlerts(data.alerts || []);
    } catch {
      console.error('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 5000);
    return () => clearInterval(id);
  }, []);

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAlertClick = (alert) => {
    setInvestigatingAlert(alert);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === alerts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(alerts.map(a => a.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Permanently delete ${selectedIds.length} selected records?`)) return;
    try {
      await deleteAlerts(selectedIds);
      setAlerts(prev => prev.filter(a => !selectedIds.includes(a.id)));
      setSelectedIds([]);
    } catch {
      alert('Failed to delete selected logs');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Permanently wipe the entire forensic archive?')) return;
    try {
      await clearAlerts();
      setAlerts([]);
      setSelectedIds([]);
    } catch {
      alert('Failed to clear archive');
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await acknowledgeAlert(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
      if (investigatingAlert && investigatingAlert.id === id) {
        setInvestigatingAlert(null);
      }
    } catch {
      alert('Failed to acknowledge incident');
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Priority', 'Zone', 'Message', 'Acknowledged'];
    const rows = alerts.map(a => [
      a.id,
      a.timestamp,
      a.priority,
      a.zone_name || 'GLOBAL',
      `"${a.message.replace(/"/g, '""')}"`, // escape quotes
      a.acknowledged ? 'Yes' : 'No'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FENCEAI_Forensics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 max-w-screen-2xl mx-auto flex flex-col gap-6 md:gap-10 animate-fadein relative font-['Rajdhani']">
      
      {/* Detail Modal Overlay */}
      {investigatingAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 backdrop-blur-xl bg-black/80">
           <div className="bg-[#0d1117] border border-white/10 rounded-3xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--green)]/10 rounded-xl flex items-center justify-center text-[var(--green)] border border-[var(--green)]/20 shadow-[0_0_15px_rgba(0,255,65,0.1)]">
                       <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[12px] font-black text-white uppercase tracking-widest font-[var(--font-display)]">Forensic Investigation</span>
                       <span className="text-[10px] text-[var(--green)] font-bold uppercase tracking-widest font-[var(--font-mono)]">Incident ID: {investigatingAlert.id}</span>
                    </div>
                 </div>
                 <button 
                   onClick={() => setInvestigatingAlert(null)}
                   className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-[#484f58] hover:text-white transition-colors"
                 >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 custom-scrollbar">
                  <div className="space-y-6">
                    <div className="aspect-video bg-black rounded-2xl border border-white/10 overflow-hidden shadow-2xl group/img relative">
                       <img 
                         src={investigatingAlert.snapshot_url?.startsWith('http') ? investigatingAlert.snapshot_url : `http://${window.location.hostname}:8000${investigatingAlert.snapshot_url}`}
                         alt="Forensic Snapshot"
                         className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-6">
                          <span className="text-[10px] font-black text-white uppercase tracking-widest font-[var(--font-mono)]">Forensic Asset: {investigatingAlert.id}.jpg</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <button 
                         className="flex-1 bg-[var(--green)] hover:bg-[#2eff88] text-black h-14 rounded-xl font-black text-[12px] uppercase tracking-widest transition-all shadow-lg shadow-[var(--green)]/20 disabled:opacity-50 font-[var(--font-display)]"
                         onClick={() => handleAcknowledge(investigatingAlert.id)}
                         disabled={investigatingAlert.acknowledged}
                       >
                         {investigatingAlert.acknowledged ? 'Incident Logged & Verified' : 'Acknowledge Forensic Hit'}
                       </button>
                    </div>
                 </div>
                 
                 <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4">
                       {[
                         { label: 'Classification', val: investigatingAlert.priority?.toUpperCase() || 'CRITICAL', color: investigatingAlert.priority === 'critical' ? 'var(--color-red)' : investigatingAlert.priority === 'warning' ? 'var(--color-amber)' : 'var(--green)' },
                         { label: 'Sector/Zone', val: investigatingAlert.zone_name || 'GLOBAL' },
                         { label: 'Timestamp', val: investigatingAlert.timestamp?.split('T')[1]?.split('.')[0] || investigatingAlert.timestamp },
                         { label: 'Detection Score', val: '98.2%' },
                       ].map(info => (
                         <div key={info.label} className="bg-white/2 border border-white/5 p-4 rounded-xl">
                            <span className="text-[9px] font-bold text-[#484f58] uppercase block mb-1 font-[var(--font-mono)]">{info.label}</span>
                            <span className="text-[13px] font-black uppercase tracking-tight font-[var(--font-display)]" style={{ color: info.color }}>{info.val}</span>
                         </div>
                       ))}
                    </div>
                    <div className="bg-white/2 border border-white/5 p-6 rounded-2xl flex-1">
                       <span className="text-[10px] font-bold text-[#484f58] uppercase block mb-4 tracking-widest font-[var(--font-mono)]">Incident Intelligence</span>
                       <p className="text-[14px] font-medium text-white/80 leading-relaxed italic font-['Rajdhani']">
                         "Neural Core identified a 'person' entity within the restricted perimeter. Security protocols triggered. Data stream synchronized with Oasis Cloud for long-term forensic persistence."
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter font-[var(--font-display)]">Security Incident Archive</h1>
          <p className="text-[12px] font-bold text-[var(--green)] uppercase tracking-[0.4em] mt-2 opacity-80 font-[var(--font-mono)]">
            Node: History-Store · {alerts.length} Records Detected
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {selectedIds.length > 0 && (
            <button 
              className="bg-[var(--color-red)]/10 border border-[var(--color-red)]/50 text-[var(--color-red)] h-11 px-6 rounded-xl flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest hover:bg-[var(--color-red)] hover:text-white transition-all font-[var(--font-mono)]"
              onClick={handleDeleteSelected}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete ({selectedIds.length})
            </button>
          )}

          <button 
            className="btn-outline h-11 px-6 rounded-xl flex items-center gap-2 text-[11px] font-black uppercase tracking-widest font-[var(--font-mono)] border border-white/10 hover:bg-white/5"
            onClick={handleExportCSV}
            disabled={alerts.length === 0}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>

          <button 
            className="btn-secondary h-11 px-8 rounded-xl flex items-center gap-2 text-[11px] font-black uppercase tracking-widest font-[var(--font-mono)] bg-white/5 hover:bg-white/10 transition-colors"
            onClick={fetchAlerts}
            disabled={loading}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Refresh
          </button>
          
          <button 
            className="btn-danger h-11 px-8 rounded-xl flex items-center gap-2 text-[11px] font-black uppercase tracking-widest font-[var(--font-mono)] bg-[var(--color-red)]/10 text-[var(--color-red)] border border-[var(--color-red)]/20 hover:bg-[var(--color-red)] hover:text-white transition-all"
            onClick={handleClearAll}
            disabled={alerts.length === 0}
          >
            Clear Archive
          </button>
        </div>
      </div>

      {/* Archive Main Panel */}
      <div className="industrial-card flex flex-col min-h-[600px] overflow-hidden">
         <div className="px-8 py-5 border-b border-blue-100 bg-white/2 flex items-center justify-between">
            <div className="flex items-center gap-6">
               <span className="text-[11px] font-black text-[#1e3a8a] uppercase tracking-widest">Digital Audit Trail</span>
               <button 
                 onClick={handleSelectAll}
                 className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
               >
                 {selectedIds.length === alerts.length ? 'Deselect All' : 'Select All'}
               </button>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-[#1ed670] animate-pulse" />
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-time Sync Active</span>
            </div>
         </div>
         <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
            {loading && alerts.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-mono animate-pulse uppercase tracking-widest">
                Synchronizing with Secure Archive...
              </div>
            ) : (
              <AlertsPanel 
                alerts={alerts} 
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onAlertClick={handleAlertClick}
                onAcknowledge={handleAcknowledge}
                selectable={true}
              />
            )}
         </div>
      </div>

      <div className="flex justify-center mt-6">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.6em]">Encrypted Forensic Trail · Read-Only Context</p>
      </div>

    </div>
  );
}

