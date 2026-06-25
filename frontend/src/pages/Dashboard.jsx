import { useState, useEffect } from 'react';
import ZoneCanvas     from '../components/ZoneCanvas';
import AlertsPanel     from '../components/AlertsPanel';
import { toggleSystem, setCamera, postZones, toggleMachineControl, startCameraStream, stopCameraStream, resetMachine } from '../services/api';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

// Simple Count-up Hook for industrial stats
function useCountUp(target, duration = 1000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(target) || 0;
    if (start === end) { setCount(end); return; }
    let totalMilisecDur = duration;
    let incrementTime = Math.max(totalMilisecDur / (end || 1), 20);
    let timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) { setCount(end); clearInterval(timer); }
    }, incrementTime);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

export default function Dashboard({ 
  status, 
  alerts, 
  zones = [], 
  setZones, 
  connected, 
  systemActive, 
  machineStatus, 
  machineControlEnabled,
  activeCameraId,
  setActiveCameraId,
  isReconnecting,
  availableCameras = []
}) {
  const [toggling, setToggling] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'grid'
  const [showHeatmap, setShowHeatmap] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'zones') {
      setIsDrawing(true);
    }
  }, [location]);
  
  const isIntrusion = status?.status === 'intrusion';
  const intruderCount = status?.intruderCount || 0;

  // Animated Stats
  const animAlertsCount = useCountUp(alerts.length);
  const animIntrusionCount = useCountUp(alerts.filter(a => a.kind === 'intrusion').length);
  const animWarningCount = useCountUp(alerts.filter(a => a.kind === 'warning').length);

  const handleToggleSystem = async () => {
    setToggling(true);
    try { await toggleSystem(!systemActive); } catch { alert('Failed to toggle system'); } finally { setToggling(false); }
  };

  const handleCameraSwitch = async (id) => {
    if (id === activeCameraId) return;
    setSwitching(true);
    try {
      const res = await setCamera(id);
      if (res && res.activeCameraId) {
        setActiveCameraId(res.activeCameraId);
      } else {
        setActiveCameraId(id);
      }
      if (res && res.zones) {
        setZones(res.zones);
      }
    } catch {
      alert('Failed to switch camera');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="p-4 md:p-10 flex flex-col gap-6 md:gap-10 h-full overflow-y-auto custom-scrollbar">

      {/* ── Status Banner (mobile only) ─────────────────────────── */}
      {!isDrawing && (
        <div className={`md:hidden flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-500
          ${isIntrusion 
            ? 'bg-[var(--danger-bg)] border-[var(--danger-border)] text-[var(--danger)] shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
            : 'bg-[var(--em-glow)] border-[var(--border-em)] text-[var(--em)]'}`}>
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isIntrusion ? 'bg-[var(--danger)] animate-pulse' : 'bg-[var(--em)]'}`} />
          <span className="text-[11px] font-black uppercase tracking-[0.15em]">
            {isIntrusion ? 'CRITICAL INTRUSION' : 'SYSTEM SECURE'}
          </span>
          <span className="ml-auto text-[10px] font-bold opacity-60 font-mono">{activeCameraId?.toUpperCase()}</span>
        </div>
      )}

      {/* ── Stat Pills Row (mobile) ─────────────────────────────── */}
      {!isDrawing && (
        <div className="grid grid-cols-4 gap-2.5 md:hidden">
          {[
            { label: 'FPS', val: status?.fps || '0', color: 'var(--em)' },
            { label: 'Persons', val: status?.personCount || 0, color: 'var(--em)' },
            { label: 'Intruders', val: intruderCount, color: intruderCount > 0 ? 'var(--danger)' : 'var(--em)' },
            { label: 'Alerts', val: alerts.length, color: 'var(--warning)' },
          ].map(s => (
            <div key={s.label} className="glass-card p-2.5 flex flex-col items-center gap-0.5" style={{border:'1px solid var(--border)'}}>
              <span className="text-[8px] font-bold text-muted uppercase tracking-[0.1em]" style={{color:'var(--text-sec)'}}>{s.label}</span>
              <span className="text-sm font-black" style={{ color: s.color }}>{s.val}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 md:gap-8 flex-1 min-h-0">
        
        {/* ── Left Column: Live Monitoring ────────────────────────────── */}
        <div className="flex flex-col gap-6 min-w-0">
          
          <div className={`glass-card flex-1 flex flex-col min-h-0 overflow-hidden transition-all duration-500
            ${isIntrusion ? 'border-[var(--danger)] shadow-[0_0_40px_rgba(239,68,68,0.1)]' : ''}`}
            style={{borderColor: isIntrusion ? 'var(--danger)' : 'var(--border)'}}>
             
             <div className="panel-header px-6 py-4 flex items-center justify-between" style={{background:'rgba(255,255,255,0.02)', borderBottom:'1px solid var(--border)'}}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isIntrusion ? 'bg-[var(--danger)] animate-pulse' : 'bg-[var(--em)]'} pulse-ring`} />
                  <span className="text-[13px] font-black uppercase tracking-[0.2em] text-white">
                    {viewMode === 'grid' ? 'Node Cluster Grid' : `Live Monitor · ${(activeCameraId || '').toUpperCase()}`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                   {/* Heatmap Toggle */}
                   <button 
                     onClick={() => setShowHeatmap(!showHeatmap)}
                     className={`p-2 rounded-xl transition-all duration-300 ${showHeatmap ? 'bg-[var(--em-glow)] text-[var(--em)]' : 'text-muted hover:text-white'}`}
                     style={{border:'1px solid', borderColor: showHeatmap ? 'var(--border-em)' : 'transparent'}}
                     title="Forensic Heatmap Overlay"
                   >
                     <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.657 16.657L13.414 12.414m0 0A8 8 0 101.414 1.414a8 8 0 0011.314 11.314z" /></svg>
                   </button>

                   {/* Grid Toggle */}
                   <button 
                     onClick={() => setViewMode(viewMode === 'single' ? 'grid' : 'single')}
                     className="p-2 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-all"
                     title={viewMode === 'single' ? 'Switch to Grid View' : 'Switch to Single View'}
                   >
                     {viewMode === 'single' ? (
                       <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                     ) : (
                       <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z" /></svg>
                     )}
                   </button>

                   <select 
                     className="bg-black border border-white/10 text-[11px] font-bold text-[var(--em)] rounded-xl px-4 py-1.5 outline-none font-mono"
                     value={activeCameraId}
                     onChange={(e) => handleCameraSwitch(e.target.value)}
                     disabled={switching || viewMode === 'grid'}
                   >
                     {availableCameras.length > 0 ? (
                       availableCameras.map(cam => (
                         <option key={cam.id} value={cam.id}>
                           {(cam.node_name || cam.name || cam.id || 'Unnamed').toUpperCase()}
                         </option>
                       ))
                     ) : (
                       <option value="">No Active Nodes</option>
                     )}
                   </select>
                </div>
             </div>

             <div className="flex-1 flex flex-col md:flex-row relative bg-black group min-h-0" style={{minHeight: '240px'}}>
                {viewMode === 'single' ? (
                  <>
                    <div className="flex-1 h-full relative min-h-0">
                      <ZoneCanvas 
                        zones={zones} 
                        setZones={setZones} 
                        status={status} 
                        activeCameraId={activeCameraId} 
                        drawing={isDrawing}
                        setDrawing={setIsDrawing}
                        cameras={availableCameras}
                      />
                      {showHeatmap && (
                        <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen bg-gradient-radial from-red-500/20 via-orange-500/10 to-transparent" />
                      )}
                      {isReconnecting && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-50">
                          <div className="w-12 h-12 border-4 border-[var(--green)] border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(0,255,65,0.2)]" />
                          <span className="text-white font-black uppercase tracking-widest text-lg font-[var(--font-display)]">Reconnecting...</span>
                          <span className="text-[#8b949e] font-bold text-xs uppercase mt-2 font-[var(--font-mono)]">Restoring Vision Stream</span>
                        </div>
                      )}
                      
                      {/* Metrics Overlay (Top Left) - Only in Single View */}
                      <div className="absolute top-6 left-6 p-6 glass-card border border-white/5 flex flex-col gap-3 min-w-[200px] pointer-events-none transition-transform group-hover:scale-105 shadow-3xl z-30" style={{background:'rgba(8,10,12,0.7)', border:'1px solid var(--border)'}}>
                         <div className="flex justify-between items-center text-[11px] font-mono">
                           <span className="text-muted uppercase font-bold" style={{color:'var(--text-sec)'}}>Detected Targets</span>
                           <span className="text-white font-black text-[14px]">{status?.personCount || 0}</span>
                         </div>
                         <div className="flex justify-between items-center text-[11px] font-mono">
                           <span className="text-[var(--danger)] font-bold uppercase">Breach Count</span>
                           <span className="text-[var(--danger)] font-black text-[14px]">{intruderCount}</span>
                         </div>
                         <div className="flex justify-between items-center text-[11px] font-mono" style={{borderTop:'1px solid var(--border)', paddingTop:'8px', marginTop:'4px'}}>
                           <span className="text-[var(--em)] font-bold uppercase">Engine Load</span>
                           <span className="text-[var(--em)] font-black text-[14px]">{status?.fps || 0} FPS</span>
                         </div>
                         <div className="flex justify-between items-center text-[11px] font-mono">
                           <span className="text-muted font-bold uppercase" style={{color:'var(--text-sec)'}}>E2E Latency</span>
                           <span className="text-white font-black text-[14px]">{String(status?.latency || 0).endsWith('ms') ? status.latency : `${status?.latency || 0}ms`}</span>
                         </div>
                      </div>
                    </div>

                    {/* Fleet Side-Panel */}
                    <div className="w-full md:w-[280px] bg-[#0d1117] border-l border-white/5 flex flex-col overflow-y-auto custom-scrollbar shrink-0 z-30">
                       <div className="p-4 border-b border-white/5 flex items-center justify-between">
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Surveillance Fleet</span>
                         <span className="badge-bright text-[8px] bg-[var(--em-glow)] text-[var(--em)] px-2 py-0.5 rounded border border-[var(--border-em)]">{availableCameras.length} Nodes</span>
                       </div>
                       <div className="flex-1 p-3 flex flex-col gap-2.5">
                          {availableCameras.map(cam => {
                            const isActive = cam.id === activeCameraId;
                            const isOnline = cam.status === 'online';
                            return (
                              <div 
                                key={cam.id}
                                onClick={() => handleCameraSwitch(cam.id)}
                                className={`border p-3.5 rounded-2xl flex flex-col gap-3 cursor-pointer transition-all duration-300 group/item
                                  ${isActive 
                                    ? 'bg-[var(--em-glow)] border-[var(--border-em)] text-white shadow-lg shadow-[var(--em-glow)]/10' 
                                    : 'bg-white/[0.01] border-white/5 text-white/60 hover:bg-white/[0.03] hover:border-white/10'}`}
                                style={{borderColor: isActive ? 'var(--border-em)' : 'var(--border)'}}
                              >
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                       <div className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-[var(--em)] animate-pulse' : 'bg-red-500'}`} />
                                       <span className="text-[11px] font-black uppercase tracking-tight text-white truncate">
                                         {cam.node_name || cam.name || cam.id}
                                       </span>
                                    </div>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        const action = isOnline ? stopCameraStream : startCameraStream;
                                        const actionStr = isOnline ? 'stopping' : 'starting';
                                        try {
                                          toast.loading(`Surveillance stream ${actionStr}...`, { id: 'stream-toggle-dash' });
                                          await action(cam.id);
                                          toast.success(`Surveillance stream updated`, { id: 'stream-toggle-dash' });
                                        } catch {
                                          toast.error('Failed to change stream worker state', { id: 'stream-toggle-dash' });
                                        }
                                      }}
                                      className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all shrink-0 ml-2
                                        ${isOnline 
                                          ? 'bg-red-500/20 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white' 
                                          : 'bg-[var(--em)] text-black hover:scale-105 shadow-[0_0_15px_rgba(16,185,129,0.2)]'}`}
                                    >
                                      {isOnline ? 'Stop' : 'Start'}
                                    </button>
                                 </div>
                                 <div className="flex items-center justify-between text-[9px] font-mono text-white/40">
                                   <span>FPS: {cam.fps || '0.0'}</span>
                                   <span>LAT: {cam.latency ? `${cam.latency}ms` : '0ms'}</span>
                                 </div>
                              </div>
                            );
                          })}
                       </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 grid-rows-2 h-full gap-1 p-1 bg-[#05070a] w-full">
                    {(availableCameras.length > 0 ? availableCameras.map(c => c.id) : ['cam_01', 'cam_02', 'cam_03', 'cam_04']).map(id => (
                      <div key={id} 
                           onClick={() => handleCameraSwitch(id)}
                           className={`relative border rounded-sm overflow-hidden bg-[#0d1117] group/cam cursor-pointer transition-all
                             ${id === activeCameraId ? 'border-[var(--green)]/50 ring-1 ring-[var(--green)]/20' : 'border-white/5 opacity-40 hover:opacity-100 hover:border-white/20'}`}>
                        {id === activeCameraId ? (
                           <ZoneCanvas zones={zones} setZones={setZones} status={status} activeCameraId={id} cameras={availableCameras} />
                        ) : (
                           <img
                             key={`grid-cam-${id}`}
                             src={`/api/cameras/${id}/stream`}
                             alt={`Live ${id}`}
                             className="w-full h-full object-cover pointer-events-none select-none opacity-60 group-hover/cam:opacity-100 transition-opacity"
                             draggable={false}
                           />
                        )}
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-black text-white border border-white/10 uppercase font-[var(--font-mono)]">
                          {id}
                        </div>
                      </div>
                    ))}
                    {isReconnecting && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-50">
                        <div className="w-12 h-12 border-4 border-[var(--green)] border-t-transparent rounded-full animate-spin mb-4" />
                        <span className="text-white font-black uppercase tracking-widest text-lg">Reconnecting...</span>
                      </div>
                    )}
                  </div>
                )}
             </div>
          </div>

          {/* Bottom Panels Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
             {/* Active Zones Section */}
              <div className="glass-card flex flex-col p-6" style={{border:'1px solid var(--border)'}}>
                <div className="flex items-center justify-between mb-8">
                   <span className="text-[12px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                     <svg width="18" height="18" fill="none" stroke="var(--em)" strokeWidth="2.5"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                     Active Safety Zones
                   </span>
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full blink" style={{background:'var(--em)'}} />
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{color:'var(--text-muted)'}}>Live Sync</span>
                   </div>
                </div>

                <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2">
                   {zones.length === 0 ? (
                     <div className="flex-1 flex items-center justify-center text-muted text-[11px] font-bold uppercase tracking-[0.3em]" style={{color:'var(--text-dim)'}}>
                        No Boundaries Defined
                     </div>
                   ) : (
                     zones.map((zone, idx) => {
                        const isBreached = status?.status === 'intrusion' && status?.message?.includes(zone.name);
                        return (
                          <div key={idx} className={`border p-4 rounded-2xl flex items-center justify-between transition-all duration-300
                            ${isBreached ? 'bg-[var(--danger-bg)]' : 'bg-white/[0.02]'}`}
                            style={{borderColor: isBreached ? 'var(--danger)' : 'var(--border)'}}>
                             <div className="flex items-center gap-4">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-black transition-all
                                  ${isBreached ? 'bg-[var(--danger)] text-black' : 'bg-[var(--em-glow)] text-[var(--em)]'}`}
                                  style={{border: isBreached ? 'none' : '1px solid var(--border-em)'}}>
                                   {idx + 1}
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-[12px] font-black text-white uppercase tracking-tight">{zone.name}</span>
                                   <span className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{color:'var(--text-sec)'}}>
                                     {(zone.type || 'danger').toUpperCase()} · DWELL {zone.dwell_time}s
                                   </span>
                                </div>
                             </div>
                             <div className="flex flex-col items-end">
                                <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${isBreached ? 'text-[var(--danger)]' : 'text-[var(--em)]'}`}>
                                   {isBreached ? 'BREACHED' : 'SECURE'}
                                </span>
                                {zone.is_cooldown && (
                                  <span className="text-[8px] font-bold px-2 py-0.5 rounded-full uppercase mt-1" style={{background:'var(--warning-bg)', color:'var(--warning)', border:'1px solid rgba(245,158,11,0.2)'}}>
                                    COOLDOWN
                                  </span>
                                )}
                             </div>
                          </div>
                        );
                     })
                   )}
                </div>

                <div className="mt-6 pt-6 border-t border-white/5">
                   <div className="flex justify-between items-center text-[10px] font-bold text-[#484f58] uppercase tracking-widest">
                      <span>System Load</span>
                      <span className="text-white">14.2%</span>
                   </div>
                   <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                      <div className="w-[14%] h-full bg-[#1ed670]/40" />
                   </div>
                </div>
             </div>

             {/* Today's Summary with Animated Counts */}
             <div className="industrial-card flex flex-col p-6">
                <div className="flex items-center justify-between mb-8">
                   <span className="text-[12px] font-extrabold uppercase tracking-widest">Today's Summary</span>
                   <select className="bg-[#161b22] border-none text-[10px] font-bold text-[#8b949e] rounded-lg px-3 py-1 outline-none">
                     <option>Live Audit</option>
                   </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-10">
                   {[
                     { label: 'Total Alerts', val: animAlertsCount, icon: '🔔', color: '#1ed670' },
                     { label: 'Intrusions', val: animIntrusionCount, icon: '👤', color: '#f85149' },
                     { label: 'Warnings', val: animWarningCount, icon: '⚠️', color: '#fbbf24' },
                     { label: 'Safe Hours', val: '10h 42m', icon: '🛡️', color: '#1ed670' },
                   ].map(stat => (
                     <div key={stat.label} className="bg-[#161b22] p-4 rounded-xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors">
                        <div className="flex flex-col">
                           <span className="text-[9px] font-bold text-[#8b949e] uppercase tracking-wider mb-1">{stat.label}</span>
                           <div className="text-xl font-black text-white">{stat.val}</div>
                        </div>
                        <span className="text-xl group-hover:scale-110 transition-transform">{stat.icon}</span>
                     </div>
                   ))}
                </div>

                <div className="flex-1 flex flex-col">
                   <span className="text-[10px] font-bold text-[#8b949e] uppercase mb-4">Alerts Over Time</span>
                   <div className="flex-1 bg-[#161b22]/30 rounded-xl border border-white/5 flex items-end justify-between px-6 py-4 gap-1">
                      {[4, 8, 3, 7, 5, 10, 4, 8, 6, 9, 3, 5].map((h, i) => (
                        <div key={i} className="flex-1 bg-gradient-to-t from-[#f85149]/20 to-[#f85149]/60 rounded-t-sm" style={{ height: `${h * 8}%` }} />
                      ))}
                   </div>
                   <div className="flex justify-between text-[8px] font-bold text-[#484f58] mt-2 uppercase tracking-widest">
                      <span>12 AM</span><span>04 AM</span><span>08 AM</span><span>12 PM</span><span>04 PM</span><span>08 PM</span><span>12 AM</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* ── Right Column: Status & Control ────────────────────────── */}
        <aside className="flex flex-col gap-6">
          
          {/* High Impact Status Card */}
          <div className={`glass-card p-6 flex items-center gap-5 transition-all duration-500
            ${isIntrusion ? 'bg-[var(--danger-bg)] border-[var(--danger)] shadow-[0_0_50px_rgba(239,68,68,0.15)]' : 'bg-[var(--em-glow)] border-[var(--border-em)]'}`}
            style={{border:'2px solid'}}>
             <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500
               ${isIntrusion ? 'bg-[var(--danger)]' : 'bg-[var(--em)]'}`}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={isIntrusion ? 'white' : 'black'} strokeWidth="3">
                  {isIntrusion ? <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> : <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />}
                </svg>
             </div>
             <div className="flex flex-col">
                <span className="text-xl font-black uppercase tracking-tight leading-none text-white">
                  {isIntrusion ? 'INTRUSION DETECTED' : 'SYSTEM SECURE'}
                </span>
                <span className={`text-[11px] font-bold uppercase tracking-[0.1em] opacity-60 mt-1`}>
                  {isIntrusion ? 'Critical breach active' : 'All sectors nominal'}
                </span>
             </div>
          </div>

          <div className="industrial-card p-6 flex flex-col gap-6">
             <div className="flex items-center justify-between">
                <span className="text-[12px] font-extrabold uppercase tracking-widest">System Status</span>
                <span className="badge-bright">Nominal</span>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#161b22] p-4 rounded-xl border border-white/5">
                   <span className="text-[9px] font-bold text-[#8b949e] uppercase block mb-1">System State</span>
                   <span className={`text-sm font-black uppercase ${isIntrusion ? 'text-[#f85149]' : 'text-[#1ed670]'}`}>
                      {isIntrusion ? 'ALERT' : 'ACTIVE'}
                   </span>
                </div>
                <div className="bg-[#161b22] p-4 rounded-xl border border-white/5">
                   <span className="text-[9px] font-bold text-[#8b949e] uppercase block mb-1">Person Count</span>
                    <div className="flex items-center gap-2">
                       <svg width="14" height="14" fill="#1ed670"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                       <span className="text-white font-black text-[14px]">{status?.personCount || 0}</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Hardware & Motor Status Telemetry */}
           <div className="glass-card p-6 flex flex-col gap-5" style={{border:'1px solid var(--border)'}}>
             <div className="panel-header border-none p-0 mb-2 flex items-center justify-between">
                <span className="text-[12px] font-black uppercase tracking-[0.2em]">Hardware & Motor Status</span>
                <div className={`w-2.5 h-2.5 rounded-full ${status?.motor_status === 'STOPPED' ? 'bg-[var(--danger)] animate-pulse' : 'bg-[var(--em)]'} pulse-ring`} />
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                {/* Person Detection */}
                <div className="bg-white/[0.01] p-4 rounded-2xl border border-white/5 flex flex-col gap-1" style={{borderColor:'var(--border)'}}>
                   <span className="text-[9px] font-bold text-muted uppercase tracking-[0.05em]" style={{color:'var(--text-sec)'}}>Person Detection</span>
                   <span className={`text-base font-black uppercase ${status?.person_detection === 'YES' ? 'text-[var(--danger)]' : 'text-[var(--em)]'}`}>
                      {status?.person_detection || 'NO'}
                   </span>
                </div>
                
                {/* Buzzer */}
                <div className="bg-white/[0.01] p-4 rounded-2xl border border-white/5 flex flex-col gap-1" style={{borderColor:'var(--border)'}}>
                   <span className="text-[9px] font-bold text-muted uppercase tracking-[0.05em]" style={{color:'var(--text-sec)'}}>Buzzer Status</span>
                   <span className={`text-base font-black uppercase ${status?.buzzer_status === 'ON' ? 'text-[var(--danger)] animate-pulse' : 'text-white/60'}`}>
                      {status?.buzzer_status || 'OFF'}
                   </span>
                </div>

                {/* Relay */}
                <div className="bg-white/[0.01] p-4 rounded-2xl border border-white/5 flex flex-col gap-1" style={{borderColor:'var(--border)'}}>
                   <span className="text-[9px] font-bold text-muted uppercase tracking-[0.05em]" style={{color:'var(--text-sec)'}}>Relay Status</span>
                   <span className={`text-base font-black uppercase ${status?.relay_status === 'ON' ? 'text-[var(--em)]' : 'text-white/40'}`}>
                      {status?.relay_status || 'OFF'}
                   </span>
                </div>

                {/* Motor */}
                <div className="bg-white/[0.01] p-4 rounded-2xl border border-white/5 flex flex-col gap-1" style={{borderColor:'var(--border)'}}>
                   <span className="text-[9px] font-bold text-muted uppercase tracking-[0.05em]" style={{color:'var(--text-sec)'}}>Motor Status</span>
                   <span className={`text-base font-black uppercase ${status?.motor_status === 'RUNNING' ? 'text-[var(--em)]' : 'text-[var(--danger)]'}`}>
                      {status?.motor_status || 'RUNNING'}
                   </span>
                </div>
             </div>
           </div>

           <div className="glass-card p-6" style={{border:'1px solid var(--border)'}}>
             <div className="panel-header border-none p-0 mb-6 flex items-center justify-between">
                <span className="text-[12px] font-black uppercase tracking-[0.2em]">Safety Controls</span>
                <div className={`w-3 h-3 rounded-full ${machineStatus === 'stopped' ? 'bg-[var(--danger)]' : 'bg-[var(--em)]'} pulse-ring`} />
             </div>
             <div className="flex items-center justify-between p-5 rounded-2xl border mb-6" style={{background:'rgba(255,255,255,0.02)', borderColor:'var(--border)'}}>
                <div className="flex items-center gap-4">
                   <div className="w-11 h-11 bg-black/40 rounded-xl flex items-center justify-center" style={{color: machineStatus === 'stopped' ? 'var(--danger)' : 'var(--em)', border:'1px solid var(--border)'}}>
                      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{color:'var(--text-sec)'}}>Unit Status</span>
                      <span className={`text-base font-black uppercase ${machineStatus === 'stopped' ? 'text-[var(--danger)]' : 'text-[var(--em)]'}`}>
                         {(machineStatus || 'idle').toUpperCase()}
                      </span>
                   </div>
                </div>
                {machineStatus === 'stopped' ? (
                   <button
                     onClick={async () => {
                       try {
                         toast.loading('Resetting machine interlocks...', { id: 'machine-reset-dash' });
                         await resetMachine();
                         toast.success('Machine Interlocks Reset Safely', { id: 'machine-reset-dash' });
                       } catch {
                         toast.error('Reset Authorization Denied', { id: 'machine-reset-dash' });
                       }
                     }}
                     className="px-4 py-2 bg-[var(--em)] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] ml-auto"
                   >
                     Reset Interlock
                   </button>
                 ) : (
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center ${machineStatus === 'stopped' ? 'bg-[var(--danger)]' : 'bg-[var(--em)]'}`}>
                      <div className="w-4 h-4 bg-black/20 rounded-sm" />
                   </div>
                 )}
             </div>
             <div className="flex items-center justify-between px-2">
                <div className="flex flex-col">
                   <span className="text-[12px] font-black text-white uppercase tracking-tight">Auto-Shutdown</span>
                   <span className="text-[9px] font-bold uppercase" style={{color:'var(--text-dim)'}}>Fail-safe protection</span>
                </div>
                <div 
                  className={`toggle-switch ${machineControlEnabled ? 'toggle-switch-on' : ''}`}
                  onClick={async () => {
                     try { await toggleMachineControl(!machineControlEnabled); } catch { alert('Failed to toggle safety switch'); }
                  }}
                >
                  <div className="toggle-thumb" />
                </div>
             </div>
          </div>

          <div className="glass-card p-6" style={{border:'1px solid var(--border)'}}>
             <div className="panel-header border-none p-0 mb-6 flex items-center justify-between">
                <span className="text-[12px] font-black uppercase tracking-[0.2em]">Boundary Management</span>
                <button 
                  className="btn-em py-1.5 px-4 text-[10px] rounded-lg"
                  onClick={() => setIsDrawing(true)}
                >
                  + Add Zone
                </button>
             </div>
             <div className="flex flex-col gap-3">
                {zones.map((z, idx) => (
                  <div key={idx} className="bg-white/[0.02] border p-4 rounded-2xl flex items-center justify-between group hover:border-[var(--border-em)] transition-all duration-300" style={{borderColor:'var(--border)'}}>
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all
                          ${z.type === 'danger' ? 'bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger-border)]' : 'bg-[var(--warning-bg)] text-[var(--warning)]'}`}
                          style={{border: z.type === 'danger' ? '1px solid var(--danger-border)' : '1px solid rgba(245,158,11,0.2)'}}>
                           <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[13px] font-black text-white uppercase tracking-tight">{z.name}</span>
                           <span className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{color:'var(--text-dim)'}}>Safety Protocol Active</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={async () => {
                            const updated = zones.filter((_, i) => i !== idx);
                            try { await postZones(updated, activeCameraId); setZones(updated); } catch { alert('Sync Failed'); }
                          }}
                          className="p-2.5 hover:bg-[var(--danger-bg)] rounded-xl transition-colors"
                          style={{color:'var(--text-dim)'}}
                          onMouseEnter={e => e.currentTarget.style.color='var(--danger)'}
                          onMouseLeave={e => e.currentTarget.style.color='var(--text-dim)'}
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          </div>

        </aside>

      </div>
    </div>
  );
}
