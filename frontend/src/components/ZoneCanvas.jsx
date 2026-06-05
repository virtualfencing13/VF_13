import { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { postZones, resetZones } from '../services/api';

const toNorm = (p, w, h) => ({ x: p.x / w, y: p.y / h });
const toPx   = (pts, w, h) => pts.map(p => ({ x: p.x * w, y: p.y * h }));

export default function ZoneCanvas({ zones = [], setZones, status, activeCameraId, drawing: propDrawing, setDrawing: propSetDrawing, cameras = [] }) {
  const [localDrawing, setLocalDrawing] = useState(false);
  const drawing = propDrawing !== undefined ? propDrawing : localDrawing;
  const setDrawing = propSetDrawing !== undefined ? propSetDrawing : setLocalDrawing;
  const wrapRef      = useRef(null);
  const canvasRef    = useRef(null);
  const [draftPts, setDraftPts]           = useState([]);
  const [mouse, setMouse]                 = useState(null);
  const [selectedZoneIdx, setSelectedZoneIdx] = useState(null);
  const [isLandscape, setIsLandscape]     = useState(window.matchMedia('(orientation: landscape)').matches);
  
  // Client Camera State
  const [useClientCamera, setUseClientCamera] = useState(false);
  const videoRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const [clientBoxes, setClientBoxes] = useState([]);

  useEffect(() => {
    let stream = null;
    let interval = null;
    if (useClientCamera) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(s => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        
        interval = setInterval(() => {
          if (!videoRef.current || !hiddenCanvasRef.current) return;
          const v = videoRef.current;
          const c = hiddenCanvasRef.current;
          if (v.videoWidth === 0) return;
          c.width = v.videoWidth; c.height = v.videoHeight;
          const ctx = c.getContext('2d');
          ctx.drawImage(v, 0, 0, c.width, c.height);
          const base64 = c.toDataURL('image/jpeg', 0.5);
          
          const email = sessionStorage.getItem('operator_email') || '';
          fetch('/api/analyze_client_frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64, email })
          }).then(r => r.json()).then(data => {
            if (data.boxes) setClientBoxes(data.boxes);
          }).catch(() => {});
        }, 500);
      });
    } else {
      setClientBoxes([]);
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (interval) clearInterval(interval);
    };
  }, [useClientCamera]);

  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)');
    const handler = (e) => setIsLandscape(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    zones.forEach((zone, idx) => {
      const px = toPx(zone.points || [], W, H);
      if (px.length < 3) return;
      const isSelected = selectedZoneIdx === idx;
      const isBreached = zone.is_breached;
      let color = '#10b981'; // var(--em)
      if (zone.type === 'danger')       color = '#ef4444'; // var(--danger)
      else if (zone.type === 'warning') color = '#f59e0b'; // var(--warning)
      if (isSelected) color = '#ffffff';

      ctx.beginPath();
      ctx.moveTo(px[0].x, px[0].y);
      px.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fillStyle = isSelected ? 'rgba(255,255,255,0.2)' : (isBreached ? `${color}44` : `${color}22`);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 4 : 3;
      if (zone.type === 'warning' && !isSelected) ctx.setLineDash([8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      const cx = px.reduce((s, p) => s + p.x, 0) / px.length;
      const cy = px.reduce((s, p) => s + p.y, 0) / px.length;
      const label = `${zone.type.toUpperCase()}_${idx + 1}`;
      ctx.font = '900 10px "Inter", sans-serif';
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = color;
      ctx.fillRect(cx - (tw / 2 + 6), cy - 10, tw + 12, 18);
      ctx.fillStyle = (color === '#ffffff' || color === '#f59e0b' || color === '#10b981') ? 'black' : 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cx, cy - 1);
    });

    if (useClientCamera && clientBoxes.length > 0) {
      const v = videoRef.current;
      if (v && v.videoWidth) {
        const scaleX = W / v.videoWidth;
        const scaleY = H / v.videoHeight;
        clientBoxes.forEach(b => {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
          ctx.strokeRect(b.x1 * scaleX, b.y1 * scaleY, (b.x2 - b.x1) * scaleX, (b.y2 - b.y1) * scaleY);
          ctx.fillStyle = '#10b981';
          ctx.font = '10px monospace';
          ctx.fillText(`Person ${(b.conf*100).toFixed(0)}%`, b.x1 * scaleX, b.y1 * scaleY - 5);
        });
      }
    }

    if (draftPts.length > 0) {
      const px = toPx(draftPts, W, H);
      ctx.beginPath();
      ctx.moveTo(px[0].x, px[0].y);
      px.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      if (mouse && draftPts.length < 4) ctx.lineTo(mouse.x, mouse.y);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      px.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981'; ctx.fill();
      });
    }
  }, [zones, draftPts, mouse, selectedZoneIdx, useClientCamera, clientBoxes]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ro = new ResizeObserver(() => {
      const b = wrap.getBoundingClientRect();
      canvas.width  = b.width;
      canvas.height = b.height;
      draw();
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [draw]);

  useEffect(draw, [draw]);

  const getPos = e => {
    const b = canvasRef.current.getBoundingClientRect();
    const cx = e.clientX || (e.touches && e.touches[0].clientX);
    const cy = e.clientY || (e.touches && e.touches[0].clientY);
    return { x: cx - b.left, y: cy - b.top, w: b.width, h: b.height };
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all security zones?')) return;
    try { await resetZones(activeCameraId); setZones([]); setSelectedZoneIdx(null); }
    catch { alert('Failed to reset zones'); }
  };

  const handleDeleteSelected = async () => {
    if (selectedZoneIdx === null) return;
    const updated = zones.filter((_, i) => i !== selectedZoneIdx);
    try { await postZones(updated, activeCameraId); setZones(updated); setSelectedZoneIdx(null); }
    catch { alert('Failed to delete zone'); }
  };

  const handleCanvasInteract = (e) => {
    if (drawing && e.type === 'touchstart') e.preventDefault();
    const p = getPos(e);
    if (drawing) {
      const next = [...draftPts, toNorm(p, p.w, p.h)];
      if (next.length === 4) {
        const name = window.prompt('Sector Identifier:', `Sector ${zones.length + 1}`);
        if (!name) { setDraftPts([]); setDrawing(false); return; }
        const newZone = { name, type: 'danger', points: next, dwell_time: 0.1 };
        const updated = [...zones, newZone];
        postZones(updated, activeCameraId).then(res => setZones(res.zones || updated)).catch(() => setZones(updated));
        setDraftPts([]);
        setDrawing(false);
      } else {
        setDraftPts(next);
      }
    } else {
      let found = null;
      for (let i = zones.length - 1; i >= 0; i--) {
        const px = toPx(zones[i].points || [], p.w, p.h);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath(); ctx.moveTo(px[0].x, px[0].y);
        px.slice(1).forEach(pt => ctx.lineTo(pt.x, pt.y));
        ctx.closePath();
        if (ctx.isPointInPath(p.x, p.y)) { found = i; break; }
      }
      setSelectedZoneIdx(found);
    }
  };

  const isMobileLandscape = isLandscape && window.innerWidth < 1024;

  return (
    <div className={`relative flex flex-col group overflow-hidden bg-black
      ${isMobileLandscape ? 'fixed inset-0 z-[300]' : 'w-full h-full'}`}>
      
      {/* ── Camera Feed + Canvas ─────────────────────────────────── */}
      <div
        ref={wrapRef}
        className={`relative bg-black flex-1 ${drawing ? 'cursor-crosshair' : 'cursor-default'}`}
        onPointerMove={e => drawing && setMouse(getPos(e))}
        onPointerDown={handleCanvasInteract}
      >
        {!useClientCamera ? (() => {
          const camStatus = cameras.find(c => c.id === activeCameraId)?.status || 'offline';
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const streamUrl = useMemo(() => `/api/cameras/${activeCameraId}/stream?status=${camStatus}&t=${Date.now()}`, [activeCameraId, camStatus]);
          return (
            <img
              key={`${activeCameraId}-${camStatus}`}
              src={streamUrl}
              alt="Live"
              className="w-full h-full object-cover pointer-events-none select-none"
              draggable={false}
            />
          );
        })() : (
          <video
            ref={videoRef}
            autoPlay playsInline muted
            className="w-full h-full object-cover pointer-events-none select-none"
          />
        )}
        <canvas ref={hiddenCanvasRef} className="hidden" />
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

        {/* Drawing hint */}
        {drawing && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[var(--em)] text-black px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-2xl z-10 animate-fadein">
            NODE PLACEMENT: {draftPts.length} / 4
          </div>
        )}
      </div>

      {/* ── Control Bar (Refined for 'neat' look) ─────────────────── */}
      <div className={`bg-[#0d1117] border-t border-white/5 shrink-0 transition-all duration-300
        ${isMobileLandscape ? 'absolute bottom-0 left-0 right-0 bg-[#0d1117]/90 backdrop-blur-md' : ''}`}>

        {/* Desktop: Premium Control Bar */}
        <div className="hidden md:flex items-center justify-between px-6 h-20">
          
          <div className="flex items-center gap-2">
            {/* Primary Action: Configure */}
            <button
              onClick={() => { setDrawing(!drawing); setDraftPts([]); setSelectedZoneIdx(null); }}
              className={`h-12 px-6 rounded-2xl flex items-center gap-3 transition-all duration-300 font-black uppercase tracking-widest text-[11px]
                ${drawing 
                  ? 'bg-amber-500 text-black shadow-[0_0_30px_rgba(245,158,11,0.3)]' 
                  : 'bg-[var(--em)] text-black shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:scale-105'}`}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3">
                {drawing ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M12 4v16m8-8H4" />}
              </svg>
              {drawing ? 'Abort Design' : 'Configure Zone'}
            </button>

            <div className="w-[1px] h-8 bg-white/5 mx-2" />

            {/* Context Actions: Selection Based */}
            <div className="flex items-center gap-2">
              <button
                disabled={selectedZoneIdx === null}
                onClick={handleDeleteSelected}
                className={`h-12 px-5 rounded-2xl border flex items-center gap-3 transition-all duration-300 font-black uppercase tracking-widest text-[10px]
                  ${selectedZoneIdx !== null 
                    ? 'border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white' 
                    : 'border-white/5 text-muted opacity-40 pointer-events-none'}`}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete Sector
              </button>

              <button
                onClick={() => setUseClientCamera(!useClientCamera)}
                className="h-12 px-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 text-white/60 hover:text-white flex items-center gap-3 transition-all duration-300 font-black uppercase tracking-widest text-[10px] whitespace-nowrap"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                {useClientCamera ? 'Station Feed' : 'Local Sensor'}
              </button>

              <button
                onClick={handleClearAll}
                className="h-12 px-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-red-500/10 hover:border-red-500/30 text-white/40 hover:text-red-500 flex items-center gap-3 transition-all duration-300 font-black uppercase tracking-widest text-[10px] whitespace-nowrap"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Purge All
              </button>
            </div>
          </div>

          {/* Right side: Status Indicators */}
          <div className="flex items-center gap-6 pr-2">
            <div className="flex flex-col items-end">
               <span className="text-[9px] font-black text-muted uppercase tracking-[0.3em] opacity-40">Neural Analysis</span>
               <div className="flex items-center gap-2.5 mt-1">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${drawing ? 'bg-amber-500' : 'bg-[var(--em)]'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${drawing ? 'text-amber-500' : 'text-white'}`}>
                    {drawing ? `${draftPts.length} / 4 NODES` : selectedZoneIdx !== null ? `Sector ${selectedZoneIdx + 1} Selected` : 'Station Active'}
                  </span>
               </div>
            </div>
          </div>

        </div>

        {/* Mobile View: High-Density Layout */}
        <div className="md:hidden flex items-center gap-2 px-4 py-4">
          <button
            onClick={() => { setDrawing(!drawing); setDraftPts([]); setSelectedZoneIdx(null); }}
            className={`flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95
              ${drawing ? 'bg-amber-500 text-black' : 'bg-[var(--em)] text-black'}`}
          >
            {drawing ? '✕ ABORT' : '+ NEW ZONE'}
          </button>
          <button
            disabled={selectedZoneIdx === null}
            onClick={handleDeleteSelected}
            className={`flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95
              ${selectedZoneIdx !== null ? 'border-red-500/30 bg-red-500/10 text-red-500' : 'border-white/5 text-muted opacity-40'}`}
          >
            DELETE
          </button>
          <button
            onClick={() => setUseClientCamera(!useClientCamera)}
            className="w-12 h-12 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center text-white/60 active:scale-95"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </button>
        </div>

      </div>
    </div>
  );
}
