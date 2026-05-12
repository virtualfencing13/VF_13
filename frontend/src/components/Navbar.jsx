import { useLocation } from 'react-router-dom';

export default function Navbar({ connected, status, alertCount, latestPriority, isWsConnected, onLogout }) {
  const isIntrusion = status === 'intrusion';
  const isWarning   = latestPriority === 'warning';
  const { pathname } = useLocation();
  const operatorEmail = sessionStorage.getItem('operator_email') || 'Unknown User';

  return (
    <header className="h-[60px] md:h-[72px] bg-black border-b border-[var(--green)]/10 sticky top-0 z-40 backdrop-blur-md">
      <div className="h-full px-4 md:px-8 flex items-center justify-between gap-3">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-[var(--green)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--green)]/20 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base md:text-lg font-black text-white tracking-tighter uppercase font-[var(--font-display)]">FENCE<span className="text-[var(--green)]">AI</span></span>
            <span className="text-[8px] md:text-[9px] font-bold text-[#0e8c45] tracking-[0.15em] uppercase font-[var(--font-mono)]">Oasis Safety Core</span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          
          {isWsConnected && (
            <div className="flex items-center gap-1.5 bg-[var(--green)]/10 border border-[var(--green)]/20 px-2 md:px-3 py-1 md:py-1.5 rounded-xl">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse" />
              <span className="text-[9px] md:text-[10px] font-black text-[var(--green)] uppercase tracking-widest hidden sm:inline font-[var(--font-mono)]">LIVE</span>
            </div>
          )}
          
          <div className="hidden md:flex items-center gap-2 bg-[#161b22] border border-white/5 px-3 py-1.5 rounded-xl">
             <div className="w-4 h-4 rounded-full bg-[var(--green)] flex items-center justify-center text-black text-[8px] font-black uppercase">
               {operatorEmail.charAt(0)}
             </div>
             <span className="text-[10px] font-bold text-[#8b949e] font-[var(--font-mono)] truncate max-w-[150px]">{operatorEmail}</span>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-500
            ${isIntrusion 
              ? (isWarning 
                  ? 'bg-[var(--color-amber)]/10 border-[var(--color-amber)]/30 text-[var(--color-amber)]' 
                  : 'bg-[var(--color-red)]/10 border-[var(--color-red)]/30 text-[var(--color-red)] shadow-[0_0_15px_rgba(255,0,60,0.3)]') 
              : 'bg-[var(--green)]/10 border-[var(--green)]/30 text-[var(--green)]'}`}>
            <div className={`w-2 h-2 rounded-full shrink-0 ${isIntrusion ? (isWarning ? 'bg-[var(--color-amber)] animate-pulse' : 'bg-[var(--color-red)] animate-ping') : 'bg-[var(--green)]'}`} />
            <span className="text-[9px] md:text-[11px] font-black uppercase tracking-tighter whitespace-nowrap font-[var(--font-display)]">
              {isIntrusion ? (isWarning ? 'Warning' : 'ALERT!') : 'Secure'}
            </span>
          </div>

        </div>
      </div>
    </header>
  );
}
