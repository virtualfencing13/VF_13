import { useState, useEffect } from 'react';
import ZoneCanvas     from '../components/ZoneCanvas';
import AlertsPanel     from '../components/AlertsPanel';
import { toggleSystem, setCamera, postZones, toggleMachineControl } from '../services/api';

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
  isReconnecting
}) {
  const [toggling, setToggling] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'grid'
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(null);

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        const data = await fetch('/api/cameras').then(r => r.json());
        setAvailableCameras(data.cameras || []);
      } catch {}
    };
    fetchCameras();
  }, []);

  // ── Mobile Streaming Logic ───────────────────────────────────
  useEffect(() => {
    let interval;
    let videoTrack;
    if (isStreaming) {
      const startStreaming = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          videoTrack = stream.getVideoTracks()[0];
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          interval = setInterval(async () => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0);
              const base64Image = canvas.toDataURL('image/jpeg', 0.6);
              
              try {
                await fetch('/api/analyze_client_frame', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ image: base64Image })
                });
              } catch (e) {
                console.error("Stream sync failed", e);
              }
            }
          }, 200); // 5 FPS for mobile sync
        } catch (err) {
          setStreamError(err.message);
          setIsStreaming(false);
        }
      };
      startStreaming();
    }
    return () => {
      if (interval) clearInterval(interval);
      if (videoTrack) videoTrack.stop();
    };
  }, [isStreaming]);
  
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
    try { await setCamera(id); } catch { alert('Failed to switch camera'); } finally { setSwitching(false); }
  };

  return (
    <div className="p-3 md:p-8 flex flex-col gap-4 md:gap-8 h-full overflow-y-auto custom-scrollbar">

      {/* ── Status Banner (mobile only) ─────────────────────────── */}
      {!isDrawing && (
        <div className={`md:hidden flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-500 font-[var(--font-display)]
          ${isIntrusion 
            ? 'bg-[var(--color-red)]/10 border-[var(--color-red)]/40 text-[var(--color-red)] shadow-[0_0_15px_rgba(255,0,60,0.2)]' 
            : 'bg-[var(--green)]/10 border-[var(--green)]/30 text-[var(--green)]'}`}>
          <div className={`w-2 h-2 rounded-full shrink-0 ${isIntrusion ? 'bg-[var(--color-red)] animate-ping' : 'bg-[var(--green)]'}`} />
          <span className="text-[11px] font-black uppercase tracking-widest">
            {isIntrusion ? '⚠ INTRUSION DETECTED' : '✓ ALL SYSTEMS SECURE'}
          </span>
          <span className="ml-auto text-[10px] font-bold opacity-60 font-[var(--font-mono)]">{activeCameraId?.toUpperCase()}</span>
        </div>
      )}

      {/* ── Stat Pills Row (mobile) ─────────────────────────────── */}
      {!isDrawing && (
        <div className="grid grid-cols-4 gap-2 md:hidden">
          {[
            { label: 'FPS', val: status?.fps || '0', color: 'var(--green)' },
            { label: 'Persons', val: status?.personCount || 0, color: 'var(--green)' },
            { label: 'Intruders', val: intruderCount, color: intruderCount > 0 ? 'var(--color-red)' : 'var(--green)' },
            { label: 'Alerts', val: alerts.length, color: 'var(--color-amber)' },
          ].map(s => (
            <div key={s.label} className="bg-[#0d1117] border border-white/5 rounded-xl p-2 flex flex-col items-center gap-0.5">
              <span className="text-[8px] font-bold text-[#8b949e] uppercase tracking-wider font-[var(--font-mono)]">{s.label}</span>
              <span className="text-base font-black font-[var(--font-display)]" style={{ color: s.color }}>{s.val}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 md:gap-8 flex-1 min-h-0">
        
        {/* ── Left Column: Live Monitoring ────────────────────────────── */}
        <div className="flex flex-col gap-6 min-w-0">
          
          <div className={`industrial-card flex-1 flex flex-col min-h-0 overflow-hidden transition-all duration-500
            ${isIntrusion ? 'border-red-500/50 shadow-[0_0_30px_rgba(248,81,73,0.15)] ring-2 ring-red-500/20' : ''}`}>
             
             <div className="panel-header bg-[#161b22]/50">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isIntrusion ? 'bg-[var(--color-red)] animate-ping' : 'bg-[var(--green)]'} pulse-ring`} />
                  <span className="text-[13px] font-extrabold uppercase tracking-widest text-white font-[var(--font-display)]">
                    {viewMode === 'grid' ? 'Multi-Node Grid' : `Live Monitoring - ${activeCameraId.toUpperCase()}`}
                  </span>
                </div>
                 <div className="flex items-center gap-2">
                    {/* Mobile Stream Toggle */}
                    <button 
                      onClick={() => setIsStreaming(!isStreaming)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all border
                        ${isStreaming 
                          ? 'bg-[var(--green)] text-black border-[var(--green)] shadow-[0_0_15px_rgba(0,255,65,0.3)]' 
                          : 'bg-[#161b22] text-[#8b949e] border-white/5 hover:border-white/10'}`}
                      title={isStreaming ? "Stop Mobile Node" : "Activate Mobile Node"}
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                        {isStreaming ? 'Streaming' : 'Mobile Node'}
                      </span>
                    </button>

                    {/* Heatmap Toggle */}
                    <button 
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      className={`p-2 rounded-lg transition-colors ${showHeatmap ? 'bg-[var(--green)]/20 text-[var(--green)]' : 'text-[#484f58] hover:text-[#8b949e]'}`}
                      title="Forensic Heatmap Overlay"
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.657 16.657L13.414 12.414m0 0A8 8 0 101.414 1.414a8 8 0 0011.314 11.314z" /></svg>
                    </button>

                    {/* Grid Toggle */}
                    <button 
                      onClick={() => setViewMode(viewMode === 'single' ? 'grid' : 'single')}
                      className="p-2 hover:bg-white/5 rounded-lg text-[#8b949e]"
                      title={viewMode === 'single' ? 'Switch to Grid View' : 'Switch to Single View'}
                    >
                      {viewMode === 'single' ? (
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                      ) : (
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z" /></svg>
                      )}
                    </button>

                    <select 
                      className="bg-[#05070a] border border-white/10 text-[11px] font-bold text-[var(--green)] rounded-lg px-3 py-1 outline-none ml-2 font-[var(--font-mono)]"
                      value={activeCameraId}
                      onChange={(e) => handleCameraSwitch(e.target.value)}
                      disabled={switching || viewMode === 'grid' || isStreaming}
                    >
                      {availableCameras.map(c => (
                        <option key={c.id} value={c.id}>{c.name || c.id.toUpperCase()}</option>
                      ))}
                      <option value="MOBILE_CAM">LOCAL DEVICE CAM</option>
                    </select>
                 </div>
             </div>

             <div className="flex-1 relative bg-black group min-h-0" style={{minHeight: '240px'}}>
                {viewMode === 'single' ? (
                  <div className="w-full h-full relative">
                    <ZoneCanvas 
                      zones={zones} 
                      setZones={setZones} 
                      status={status} 
                      activeCameraId={activeCameraId} 
                      drawing={isDrawing}
                      setDrawing={setIsDrawing}
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
                    {switching && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md z-[60] animate-fadein">
                        <div className="relative">
                          <div className="w-20 h-20 border-2 border-[var(--green)]/20 rounded-full" />
                          <div className="absolute inset-0 border-t-2 border-[var(--green)] rounded-full animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                             <svg width="24" height="24" fill="none" stroke="var(--green)" strokeWidth="2" className="animate-pulse"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          </div>
                        </div>
                        <span className="text-[var(--green)] font-black uppercase tracking-[0.3em] text-sm mt-6 animate-pulse font-[var(--font-display)]">Initiating Handshake</span>
                        <span className="text-[#484f58] font-bold text-[10px] uppercase mt-2 font-[var(--font-mono)]">Linking to CCTV Registry...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 grid-rows-2 h-full gap-1 p-1 bg-[#05070a]">
                    {(availableCameras.length > 0 ? availableCameras : [{id: 'LOADING...'}]).map(cam => (
                      <div key={cam.id} 
                           onClick={() => cam.id !== 'LOADING...' && handleCameraSwitch(cam.id)}
                           className={`relative border rounded-sm overflow-hidden bg-[#0d1117] group/cam cursor-pointer transition-all
                             ${cam.id === activeCameraId ? 'border-[var(--green)]/50 ring-1 ring-[var(--green)]/20' : 'border-white/5 opacity-40 hover:opacity-100 hover:border-white/20'}`}>
                        {cam.id === activeCameraId ? (
                           <ZoneCanvas zones={zones} setZones={setZones} status={status} activeCameraId={cam.id} />
                        ) : (
                           <div className="w-full h-full flex flex-col items-center justify-center gap-2 grayscale group-hover/cam:grayscale-0">
                              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                              <span className="text-[10px] font-bold tracking-widest font-[var(--font-mono)]">{cam.name?.toUpperCase() || cam.id?.toUpperCase()} - STANDBY</span>
                           </div>
                        )}
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-black text-white border border-white/10 uppercase font-[var(--font-mono)]">
                          {cam.id}
                        </div>
                      </div>
                    ))}
                    {isReconnecting && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-50">
                        <div className="w-12 h-12 border-4 border-[var(--green)] border-t-transparent rounded-full animate-spin mb-4" />
                        <span className="text-white font-black uppercase tracking-widest text-lg font-[var(--font-display)]">Reconnecting...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
           </div>

          {/* Bottom Panels Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
             {/* Active Zones Section */}
             <div className="industrial-card flex flex-col p-6">
                <div className="flex items-center justify-between mb-8">
                   <span className="text-[12px] font-extrabold uppercase tracking-widest flex items-center gap-2">
                     <svg width="16" height="16" fill="none" stroke="#1ed670" strokeWidth="2.5"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                     Active Zones
                   </span>
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1ed670] animate-pulse" />
                      <span className="text-[10px] text-[#8b949e] font-bold uppercase tracking-widest">Connected</span>
                   </div>
                </div>

                <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2">
                   {zones.length === 0 ? (
                     <div className="flex-1 flex items-center justify-center text-[#484f58] text-[11px] font-bold uppercase tracking-[0.2em]">
                        No Zones Defined
                     </div>
                   ) : (
                     zones.map((zone, idx) => {
                        const isBreached = status?.status === 'intrusion' && status?.message?.includes(zone.name);
                        return (
                          <div key={idx} className={`bg-[#161b22] border p-4 rounded-xl flex items-center justify-between transition-all
                            ${isBreached ? 'border-red-500/40 bg-red-500/5' : 'border-white/5'}`}>
                             <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-black
                                  ${isBreached ? 'bg-red-500/20 text-red-500' : 'bg-[#1ed670]/10 text-[#1ed670]'}`}>
                                   {idx + 1}
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-[11px] font-extrabold text-white uppercase">{zone.name}</span>
                                   <span className="text-[9px] text-[#8b949e] uppercase tracking-tighter">
                                     {zone.type.toUpperCase()} · DWELL: {zone.dwell_time}s
                                   </span>
                                </div>
                             </div>
                             <div className="flex flex-col items-end">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isBreached ? 'text-red-500' : 'text-[#1ed670]'}`}>
                                   {isBreached ? 'BREACHED' : 'SECURE'}
                                </span>
                                {zone.is_cooldown && (
                                  <span className="text-[8px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-sm uppercase mt-1">
                                    Cooldown Active
                                  </span>
                                )}
                                <div className="w-16 h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                                   <div className={`h-full transition-all duration-1000 ${isBreached ? 'w-full bg-red-500' : 'w-[10%] bg-[#1ed670]'}`} />
                                </div>
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
          <div className={`status-box ${isIntrusion ? 'status-danger' : 'status-safe'}`}>
             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isIntrusion ? 'bg-[#f85149]' : 'bg-[#1ed670]'} shadow-2xl`}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={isIntrusion ? 'white' : 'black'} strokeWidth="3">
                  {isIntrusion ? <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> : <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />}
                </svg>
             </div>
             <div className="flex flex-col">
                <span className="text-[16px] font-black uppercase tracking-tighter leading-tight">
                  {isIntrusion ? 'INTRUSION DETECTED' : 'SYSTEM SECURE'}
                </span>
                <span className={`text-[11px] font-bold uppercase tracking-wider opacity-80 mt-1`}>
                  {isIntrusion ? 'Breach Detected' : 'All zones clear'}
                </span>
             </div>
          </div>

          <div className="industrial-card p-6 flex flex-col gap-6">
             <div className="flex items-center justify-between">
                <span className="text-[12px] font-extrabold uppercase tracking-widest text-[var(--green)]">Performance Telemetry</span>
                <span className="badge-bright">Live</span>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#161b22] p-4 rounded-xl border border-white/5">
                   <span className="text-[9px] font-bold text-[#484f58] uppercase block mb-1 font-[var(--font-mono)]">Detection FPS</span>
                   <span className="text-lg font-black text-[var(--green)] font-[var(--font-display)]">
                      {status?.fps || 0}
                   </span>
                </div>
                <div className="bg-[#161b22] p-4 rounded-xl border border-white/5">
                   <span className="text-[9px] font-bold text-[#484f58] uppercase block mb-1 font-[var(--font-mono)]">Latency</span>
                   <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-white font-[var(--font-display)]">{status?.latency || 0}</span>
                      <span className="text-[8px] font-bold text-[#484f58] font-[var(--font-mono)]">MS</span>
                   </div>
                </div>
                <div className="bg-[#161b22] p-4 rounded-xl border border-white/5">
                   <span className="text-[9px] font-bold text-[#484f58] uppercase block mb-1 font-[var(--font-mono)]">Intruders</span>
                   <span className={`text-lg font-black font-[var(--font-display)] ${intruderCount > 0 ? 'text-[var(--color-red)] animate-pulse' : 'text-[#484f58]'}`}>
                      {intruderCount}
                   </span>
                </div>
                <div className="bg-[#161b22] p-4 rounded-xl border border-white/5">
                   <span className="text-[9px] font-bold text-[#484f58] uppercase block mb-1 font-[var(--font-mono)]">Persons</span>
                   <div className="flex items-center gap-2">
                      <svg width="14" height="14" fill="#1ed670"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
                      <span className="text-lg font-black text-white font-[var(--font-display)]">{status?.personCount || 0}</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="industrial-card p-6">
             <div className="panel-header border-none p-0 mb-6">
                <span className="text-[12px] font-extrabold uppercase tracking-widest">Safety Controls</span>
                <div className={`w-3 h-3 rounded-full ${machineStatus === 'stopped' ? 'bg-[#f85149]' : 'bg-[#1ed670]'} pulse-ring`} />
             </div>
             <div className="flex items-center justify-between bg-[#161b22] p-5 rounded-2xl border border-white/5 mb-6">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-black/40 rounded-xl flex items-center justify-center text-[#1ed670]">
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-[#8b949e] uppercase">Machine Status</span>
                      <span className={`text-[15px] font-black uppercase ${machineStatus === 'stopped' ? 'text-[#f85149]' : 'text-[#1ed670]'}`}>
                         {machineStatus.toUpperCase()}
                      </span>
                   </div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${machineStatus === 'stopped' ? 'bg-[#f85149]' : 'bg-[#1ed670]'}`}>
                   <div className="w-4 h-4 bg-black/20 rounded-sm" />
                </div>
             </div>
             <div className="flex items-center justify-between px-2">
                <div className="flex flex-col">
                   <span className="text-[11px] font-extrabold text-white">Enable Auto Stop</span>
                   <span className="text-[9px] text-[#484f58]">Stop machine on critical breach</span>
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

          <div className="industrial-card p-6 flex flex-col gap-6">
             <div className="panel-header border-none p-0">
                <span className="text-[12px] font-extrabold uppercase tracking-widest">Zone Management</span>
                <button 
                  className="text-[10px] font-bold text-[#1ed670] uppercase tracking-wider hover:underline"
                  onClick={() => setIsDrawing(true)}
                >
                  + Add Zone
                </button>
             </div>
             <div className="flex flex-col gap-3">
                {zones.map((z, idx) => (
                  <div key={idx} className="bg-[#161b22] border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-[#1ed670]/20 transition-all">
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg
                          ${z.type === 'danger' ? 'bg-[#f85149]/20 text-[#f85149]' : 'bg-[#fbbf24]/20 text-[#fbbf24]'}`}>
                           <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[12px] font-extrabold text-white">{z.name} ({z.type})</span>
                           <span className="text-[9px] text-[#484f58] uppercase font-bold tracking-widest">4 Points • Active</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={async () => {
                            const updated = zones.filter((_, i) => i !== idx);
                            try { await postZones(updated, activeCameraId); setZones(updated); } catch { alert('Sync Failed'); }
                          }}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-red-500/50 hover:text-red-500"
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
