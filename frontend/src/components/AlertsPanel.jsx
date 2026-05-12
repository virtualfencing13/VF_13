export default function AlertsPanel({ alerts = [], selectedIds = [], onToggleSelect, onAlertClick, onAcknowledge, selectable = false }) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[#484f58] opacity-50">
        <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-[11px] font-bold uppercase tracking-widest">No Recent Incursions</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {alerts.map((alert) => {
        const isSelected = selectedIds.includes(alert.id);
        const isAck = alert.acknowledged;
        return (
          <div 
            key={alert.id} 
            className={`bg-[#161b22] border rounded-xl p-3 flex items-center justify-between group transition-all cursor-pointer
              ${selectable && isSelected ? 'border-[#1ed670]/50 bg-[#1ed670]/5' : 'border-white/5 hover:border-white/10'}
              ${isAck ? 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0' : ''}`}
            onClick={() => onAlertClick ? onAlertClick(alert) : (selectable && onToggleSelect && onToggleSelect(alert.id))}
          >
            <div className="flex items-center gap-4">
               {/* Selection Indicator */}
               {selectable && (
                 <div 
                   className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all
                     ${isSelected ? 'bg-[#1ed670] border-[#1ed670]' : 'border-white/10 bg-white/2'}`}
                   onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect && onToggleSelect(alert.id);
                   }}
                 >
                    {isSelected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                 </div>
               )}

               {/* Mini Snapshot */}
               <div className="w-12 h-12 rounded-lg bg-black border border-white/10 overflow-hidden shrink-0">
                  {alert.snapshot_url ? (
                    <img 
                      src={alert.snapshot_url.startsWith('http') ? alert.snapshot_url : `http://${window.location.hostname}:8000${alert.snapshot_url}`} 
                      alt="Snapshot" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-[#484f58] font-bold">CAM</div>
                  )}
               </div>

               <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                     <span className="text-[10px] font-mono text-[#8b949e]">
                       {alert.timestamp?.includes('T') ? alert.timestamp.split('T')[1].split('.')[0] : alert.timestamp || '00:00:00'}
                     </span>
                     <span className={`text-[10px] font-black uppercase tracking-tight
                       ${alert.priority === 'critical' ? 'text-[#f85149]' : alert.priority === 'warning' ? 'text-[#fbbf24]' : 'text-[#1ed670]'}`}>
                       {alert.kind.replace('_', ' ')}
                     </span>
                  </div>
                  <span className="text-[12px] font-bold text-white leading-tight">{alert.message}</span>
                  <span className="text-[10px] text-[#484f58] font-bold uppercase mt-1">Zone: {alert.zone_name || 'Global'}</span>
               </div>
            </div>

            <div className="flex items-center gap-3">
              {isAck && (
                <div className="px-2 py-1 flex items-center gap-1 rounded text-[10px] font-black text-[#1ed670] uppercase tracking-widest bg-[#1ed670]/10 border border-[#1ed670]/20">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                  Reviewed
                </div>
              )}
              {!isAck && onAcknowledge && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAcknowledge(alert.id);
                  }}
                  className="px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest border border-white/10 hover:border-white/30 text-white/50 hover:text-white transition-colors"
                >
                  Mark Reviewed
                </button>
              )}
              <div className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border shrink-0
                ${alert.priority === 'critical' ? 'bg-[#f85149]/10 text-[#f85149] border-[#f85149]/20' : 
                  alert.priority === 'warning' ? 'bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/20' : 
                  alert.priority === 'breach' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                  'bg-[#1ed670]/10 text-[#1ed670] border-[#1ed670]/20'}`}>
                {alert.priority?.toUpperCase() || 'LOW'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
