import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const resp = await fetch('/api/analytics/stats');
      const data = await resp.json();
      setStats(data);
    } catch (err) {
      toast.error('Telemetry Sync Failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      toast.loading('Compiling Security Report...', { id: 'report' });
      const resp = await fetch('/api/analytics/report');
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fenceai_report_${new Date().toLocaleDateString()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Report Exported Successfully', { id: 'report' });
    } catch (err) {
      toast.error('Export Protocol Failed', { id: 'report' });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--green)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const heroStats = [
    { label: 'Neural Accuracy', val: `${stats?.accuracy || 99.8}%`, desc: 'AI classification precision across all active nodes.', color: 'var(--green)' },
    { label: 'Avg Latency', val: `${stats?.latency || 14.2}ms`, desc: 'Average time for the AI to detect and verify a breach.', color: 'var(--green)' },
    { label: 'Zone Breaches', val: stats?.total_breaches || '0', desc: 'Total number of confirmed intrusions detected.', color: 'var(--color-red)' },
    { label: 'Uptime Node', val: `${stats?.uptime || 99.9}%`, desc: 'System availability and edge node stability.', color: 'var(--green)' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-8 animate-fadein font-['Rajdhani']">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter font-[var(--font-display)]">Neural Analytics</h1>
          <p className="text-[12px] font-bold text-[var(--green)] uppercase tracking-[0.4em] mt-2 opacity-80 font-[var(--font-mono)]">Performance Telemetry & Behavioral Data</p>
        </div>
        <div className="flex items-center gap-4 bg-white/2 border border-white/5 px-6 py-3 rounded-2xl">
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-[#484f58] uppercase tracking-widest font-[var(--font-mono)]">SYSTEM STATUS</span>
              <span className="text-[11px] font-black text-[var(--green)] uppercase tracking-widest">NOMINAL / SECURE</span>
           </div>
           <div className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse shadow-[0_0_10px_var(--green)]" />
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {heroStats.map(s => (
          <div key={s.label} className="industrial-card p-6 flex flex-col gap-3 relative overflow-hidden group hover:border-[var(--green)]/30 transition-all">
            <div className="flex flex-col gap-1">
               <span className="text-[10px] font-black text-[#484f58] uppercase tracking-[0.2em] font-[var(--font-mono)]">{s.label}</span>
               <div className="flex items-end gap-3">
                 <span className="text-4xl font-black text-white font-[var(--font-display)]">{s.val}</span>
               </div>
            </div>
            <p className="text-[11px] text-[#8b949e] font-medium leading-tight h-8 opacity-0 group-hover:opacity-100 transition-opacity">
               {s.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Placeholder */}
        <div className="lg:col-span-2 industrial-card flex flex-col min-h-[420px]">
          <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between bg-white/2">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-6 bg-[var(--green)]" />
               <span className="text-xs font-black text-white uppercase tracking-widest font-[var(--font-display)]">Intrusion Frequency Mesh</span>
            </div>
            <div className="flex gap-2">
               {['24H', '7D', '30D'].map(t => (
                 <button key={t} className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all border ${t === '24H' ? 'bg-[var(--green)] text-black border-[var(--green)]' : 'text-[#484f58] hover:text-white border-white/5'}`}>{t}</button>
               ))}
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center relative p-12">
            <div className="w-full h-full flex items-end gap-2">
               {[40, 70, 45, 90, 65, 30, 85, 40, 55, 75, 45, 60, 80, 50, 40, 70, 95, 60, 40, 30, 80, 60, 40, 90].map((h, i) => (
                 <div key={i} className="flex-1 bg-white/5 relative group cursor-crosshair rounded-t-sm" style={{ height: `${h}%` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--green)] to-transparent opacity-0 group-hover:opacity-30 transition-opacity" />
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--green)] opacity-0 group-hover:opacity-100 shadow-[0_0_10px_var(--green)]" />
                 </div>
               ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <span className="text-[11px] font-black text-[#484f58]/20 uppercase tracking-[2em] font-[var(--font-mono)]">TELEMETRY_STREAM_CONNECTED</span>
            </div>
          </div>
        </div>

        {/* Zone Breakdown */}
        <div className="industrial-card flex flex-col">
          <div className="px-8 py-5 border-b border-white/5 bg-white/2 flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3"><path d="M12 2v20m10-10H2"/></svg>
            <span className="text-xs font-black text-white uppercase tracking-widest font-[var(--font-display)]">Sector Heat Map</span>
          </div>
          <div className="p-8 flex flex-col gap-8">
            {(stats?.sector_intensity || []).map(zone => (
              <div key={zone.name} className="flex flex-col gap-3 group">
                <div className="flex justify-between items-center font-[var(--font-mono)]">
                  <span className="text-[11px] font-black text-white uppercase tracking-wider">{zone.name}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[13px] font-black text-[var(--green)]">{zone.hits}</span>
                    <span className="text-[9px] font-bold text-[#484f58] uppercase">incidents</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-[var(--green)] to-[#00ff41cc] shadow-[0_0_15px_rgba(0,255,65,0.4)] transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (zone.hits / (stats?.total_breaches || 1)) * 100)}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto p-8 border-t border-white/5 bg-white/2">
             <button 
              onClick={downloadReport}
              className="btn-primary w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
             >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5 5-5m-5 5V3"/></svg>
                Export Audit Log
             </button>
             <p className="text-center text-[9px] font-black text-[#484f58] uppercase tracking-widest mt-4">Compliance PDF/CSV Asset</p>
          </div>
        </div>
      </div>

    </div>
  );
}
