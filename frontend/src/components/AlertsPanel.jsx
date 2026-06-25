export default function AlertsPanel({ alerts = [], selectedIds = [], onToggleSelect, onAlertClick, onAcknowledge, selectable = false }) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-muted opacity-50">
        <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-6 opacity-20">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-[11px] font-black uppercase tracking-[0.4em]">No Security Events Logged</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {alerts.map((alert) => {
        const isSelected = selectedIds.includes(alert.id);
        const isAck = alert.acknowledged;
        return (
          <div 
            key={alert.id} 
            className={`glass-card p-4 flex items-center justify-between group transition-all duration-300 cursor-pointer
              ${selectable && isSelected ? 'border-[var(--em)] bg-[var(--em-glow)]' : 'border-white/5 hover:border-[var(--border-em)]'}
              ${isAck ? 'opacity-40 grayscale-0 hover:opacity-100' : 'shadow-lg'}`}
            style={{borderColor: selectable && isSelected ? 'var(--em)' : '', background: selectable && isSelected ? 'rgba(16,185,129,0.05)' : ''}}
            onClick={() => onAlertClick ? onAlertClick(alert) : (selectable && onToggleSelect && onToggleSelect(alert.id))}
          >
            <div className="flex items-center gap-5">
               {/* Selection Indicator */}
               {selectable && (
                 <div 
                   className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all
                     ${isSelected ? 'bg-[var(--em)] border-[var(--em)]' : 'border-white/10 bg-black/40'}`}
                   onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect && onToggleSelect(alert.id);
                   }}
                 >
                    {isSelected && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                 </div>
               )}

               {/* Mini Snapshot */}
               <div className="w-14 h-14 rounded-xl bg-black border border-white/5 overflow-hidden shrink-0 shadow-inner relative group-hover:scale-105 transition-transform duration-500">
                  {alert.snapshot_url ? (
                    <img 
                      src={alert.snapshot_url} 
                      alt="Snapshot" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[9px] text-muted font-black uppercase">Core</div>
                  )}
                  <div className="absolute inset-0 border border-white/10 rounded-xl" />
               </div>

               <div className="flex flex-col">
                  <div className="flex items-center gap-3 mb-1.5">
                     <span className="text-[10px] font-bold font-mono text-muted uppercase tracking-widest">
                       {alert.timestamp?.includes('T') ? alert.timestamp.split('T')[1].split('.')[0] : alert.timestamp || '00:00:00'}
                     </span>
                     <span className={`text-[10px] font-black uppercase tracking-[0.1em]
                       ${alert.priority === 'critical' ? 'text-[var(--danger)]' : alert.priority === 'warning' ? 'text-[var(--warning)]' : 'text-[var(--em)]'}`}>
                       {alert.kind.replace('_', ' ')}
                     </span>
                  </div>
                  <span className="text-[13px] font-black text-white leading-tight uppercase tracking-tight">{alert.message}</span>
                  <span className="text-[10px] font-bold uppercase mt-1 tracking-widest" style={{color:'var(--text-dim)'}}>Zone: {alert.zone_name || 'Global Cluster'}</span>
               </div>
            </div>

            <div className="flex items-center gap-4">
              {isAck && (
                <div className="px-3 py-1.5 flex items-center gap-2 rounded-full text-[9px] font-black uppercase tracking-[0.15em]" style={{background:'var(--em-glow)', color:'var(--em)', border:'1px solid var(--border-em)'}}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                  Verified
                </div>
              )}
              {!isAck && onAcknowledge && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAcknowledge(alert.id);
                  }}
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 hover:bg-white/5 hover:border-white/20 text-muted hover:text-white transition-all"
                >
                  Verify
                </button>
              )}
              <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shrink-0
                ${alert.priority === 'critical' ? 'bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger-border)]' : 
                  alert.priority === 'warning' ? 'bg-[var(--warning-bg)] text-[var(--warning)] border-orange-500/20' : 
                  'bg-[var(--em-glow)] text-[var(--em)] border-[var(--border-em)]'}`}>
                {alert.priority?.toUpperCase() || 'NORMAL'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
