import { useRef, useEffect, useCallback, useState } from 'react';
import { postZones, resetZones } from '../services/api';

const toNorm = (p, w, h) => ({ x: p.x / w, y: p.y / h });
const toPx   = (pts, w, h) => pts.map(p => ({ x: p.x * w, y: p.y * h }));

export default function ZoneCanvas({ zones = [], setZones, status, activeCameraId, drawing, setDrawing }) {
  const wrapRef      = useRef(null);
  const canvasRef    = useRef(null);
  const [draftPts, setDraftPts]           = useState([]);
  const [mouse, setMouse]                 = useState(null);
  const [selectedZoneIdx, setSelectedZoneIdx] = useState(null);
  const [isLandscape, setIsLandscape]     = useState(window.matchMedia('(orientation: landscape)').matches);
  const [showControls, setShowControls]   = useState(true);
  
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
          
          fetch('/api/analyze_client_frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 })
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

  // Track orientation changes
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
      const isPending  = zone.is_pending;
      let color = '#1ed670';
      if (zone.type === 'danger')       color = isBreached ? '#f85149' : (isPending ? '#fbbf24' : '#f85149');
      else if (zone.type === 'warning') color = '#fbbf24';
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
      ctx.font = '900 10px "JetBrains Mono", monospace';
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = color;
      ctx.fillRect(cx - (tw / 2 + 6), cy - 10, tw + 12, 18);
      ctx.fillStyle = (color === '#ffffff' || color === '#fbbf24' || color === '#1ed670') ? 'black' : 'white';
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
          ctx.strokeStyle = '#1ed670';
          ctx.lineWidth = 3;
          ctx.strokeRect(b.x1 * scaleX, b.y1 * scaleY, (b.x2 - b.x1) * scaleX, (b.y2 - b.y1) * scaleY);
          ctx.fillStyle = '#1ed670';
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
      ctx.strokeStyle = '#1ed670';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      px.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#1ed670'; ctx.fill();
      });
    }
  }, [zones, draftPts, mouse, selectedZoneIdx]);

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
    try { await resetZones(); setZones([]); setSelectedZoneIdx(null); }
    catch { alert('Failed to reset zones'); }
  };

  const handleDeleteSelected = async () => {
    if (selectedZoneIdx === null) return;
    const updated = zones.filter((_, i) => i !== selectedZoneIdx);
    try { await postZones(updated, activeCameraId); setZones(updated); setSelectedZoneIdx(null); }
    catch { alert('Failed to delete zone'); }
  };

  const handleCanvasInteract = (e) => {
    // Prevent scroll when drawing on touch
    if (drawing && e.type === 'touchstart') e.preventDefault();
    const p = getPos(e);
    if (drawing) {
      const next = [...draftPts, toNorm(p, p.w, p.h)];
      if (next.length === 4) {
        const name = window.prompt('Sector Identifier (e.g. Loading Dock 4):', `Sector ${zones.length + 1}`);
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

  // In landscape on mobile, go fullscreen for drawing
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
        {!useClientCamera ? (
          <img
            src="/api/video_feed"
            alt="Live"
            className="w-full h-full object-contain pointer-events-none select-none"
            draggable={false}
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay playsInline muted
            className="w-full h-full object-contain pointer-events-none select-none"
          />
        )}
        <canvas ref={hiddenCanvasRef} className="hidden" />
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

        {/* Drawing mode hint overlay */}
        {drawing && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#1e3a8a] text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg pointer-events-none z-10">
            TAP TO PLACE POINT — {draftPts.length}/4
          </div>
        )}

        {/* Landscape close button */}
        {isMobileLandscape && (
          <button
            onClick={() => setIsLandscape(false)}
            className="absolute top-3 right-3 w-9 h-9 bg-black/60 border border-white/20 rounded-xl flex items-center justify-center text-white z-20"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Control Bar ─────────────────────────────────────────── */}
      <div className={`bg-[#0d1117] border-t border-white/5 shrink-0 transition-all duration-300
        ${isMobileLandscape ? 'absolute bottom-0 left-0 right-0 bg-[#0d1117]/90 backdrop-blur-md border-t-0' : ''}`}>

        {/* Mobile: high-tech touch buttons */}
        <div className="flex md:hidden items-center gap-2 px-4 py-3">
          <button
            className={`flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95
              ${drawing ? 'bg-amber-500 text-black shadow-amber-500/20' : 'bg-[var(--green)] text-black shadow-[var(--green)]/20'}`}
            onClick={() => { setDrawing(!drawing); setDraftPts([]); setSelectedZoneIdx(null); }}
          >
            {drawing ? '✕ ABORT' : '+ NEW ZONE'}
          </button>
          <button
            className={`flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95
              ${selectedZoneIdx !== null ? 'border-[var(--color-red)] bg-[var(--color-red)]/10 text-[var(--color-red)] shadow-[var(--color-red)]/10' : 'border-white/5 text-[#484f58]'}`}
            onClick={handleDeleteSelected}
            disabled={selectedZoneIdx === null}
          >
            DELETE
          </button>
          <button
            className="flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 text-[#8b949e] hover:bg-white/5 active:scale-95"
            onClick={() => setUseClientCamera(!useClientCamera)}
          >
            {useClientCamera ? 'SERVER CAM' : 'MY WEBCAM'}
          </button>
        </div>

        {/* Desktop: Industrial Control Strip */}
        <div className="hidden md:flex items-center justify-between px-8 h-16">
          <div className="flex items-center gap-4">
            <button
              className={`btn-action h-10 px-6 rounded-xl border transition-all
                ${drawing ? 'bg-amber-500 border-amber-500 text-black font-black shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'border-[var(--green)]/30 text-[var(--green)] hover:bg-[var(--green)]/10'}`}
              onClick={() => { setDrawing(!drawing); setDraftPts([]); setSelectedZoneIdx(null); }}
            >
              {drawing ? '✕ CANCEL DRAW' : '+ CONFIGURE ZONE'}
            </button>
            <div className="w-[1px] h-6 bg-white/5 mx-2" />
            <button
              className={`btn-action h-10 px-6 rounded-xl border transition-all
                ${selectedZoneIdx !== null ? 'border-white/40 text-white hover:bg-white/5' : 'border-white/5 text-[#484f58] pointer-events-none'}`}
            >
              MODIFY
            </button>
            <button
              className={`btn-action h-10 px-6 rounded-xl border transition-all
                ${selectedZoneIdx !== null ? 'border-[var(--color-red)] text-[var(--color-red)] bg-[var(--color-red)]/5 hover:bg-[var(--color-red)] hover:text-white' : 'border-white/5 text-[#484f58] pointer-events-none'}`}
              onClick={handleDeleteSelected}
              disabled={selectedZoneIdx === null}
            >
              DELETE SECTOR
            </button>
            <button
              className="btn-action h-10 px-6 rounded-xl border border-white/10 text-[#8b949e] hover:border-[#f85149] hover:text-[#f85149] hover:bg-[#f85149]/5"
              onClick={() => setUseClientCamera(!useClientCamera)}
            >
              {useClientCamera ? 'SWITCH TO SERVER CAM' : 'SWITCH TO MY WEBCAM'}
            </button>
            <button
              className="btn-action h-10 px-6 rounded-xl border border-white/10 text-[#8b949e] hover:border-[#f85149] hover:text-[#f85149] hover:bg-[#f85149]/5"
              onClick={handleClearAll}
            >
              PURGE ALL
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end gap-1">
               <span className="text-[9px] font-black text-[#484f58] uppercase tracking-[0.3em]">Neural Status</span>
               <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${drawing ? 'bg-amber-500' : 'bg-[var(--green)]'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${drawing ? 'text-amber-500' : 'text-[var(--green)]'}`}>
                    {drawing ? `${draftPts.length}/4 NODES PLACED` : selectedZoneIdx !== null ? `SECTOR ${selectedZoneIdx + 1} ACTIVE` : 'STATION IDLE'}
                  </span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

