export default function Navbar({ 
  status, 
  latestPriority, 
  isWsConnected 
}) {
  const isIntrusion = status === 'intrusion';
  const isWarning   = latestPriority === 'warning';
  const operatorEmail = sessionStorage.getItem('operator_email') || 'Authorized Node';

  return (
    <header className="h-[64px] md:h-[80px] sticky top-0 z-40 backdrop-blur-2xl" style={{background:'rgba(8,10,12,0.85)', borderBottom:'1px solid var(--border)'}}>
      <div className="h-full px-4 md:px-8 flex items-center justify-between gap-3">
        
        {/* Left Side: Brand Info (Simplified since toggle moved to sidebar) */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-xl tracking-tight uppercase">Control <span style={{color:'var(--em)'}}>Matrix</span></span>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted" style={{color:'var(--text-dim)'}}>Oasis_v2.4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side indicators */}
        <div className="flex items-center gap-4">
          
          {/* Connection Status */}
          {isWsConnected && (
            <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[var(--em)]/5 border border-[var(--em)]/20">
              <div className="w-2 h-2 rounded-full bg-[var(--em)] shadow-[0_0_10px_var(--em)] blink" />
              <span className="text-[10px] font-black text-[var(--em)] uppercase tracking-widest">Live Engine</span>
            </div>
          )}
          
          {/* Alert Status Pill */}
          <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all duration-500
            ${isIntrusion 
              ? (isWarning 
                  ? 'bg-[var(--warning-bg)] border-[var(--warning)] text-[var(--warning)]' 
                  : 'bg-[var(--danger-bg)] border-[var(--danger)] text-[var(--danger)] shadow-[0_0_30px_rgba(239,68,68,0.2)]') 
              : 'bg-white/5 border-white/5 text-white/60'}`}
            style={{borderWidth:'1px'}}>
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isIntrusion ? (isWarning ? 'bg-[var(--warning)]' : 'bg-[var(--danger)] animate-pulse shadow-[0_0_10px_var(--danger)]') : 'bg-gray-700'}`} />
            <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
              {isIntrusion ? (isWarning ? 'Sector Attention' : 'Critical Breach') : 'Sectors Secure'}
            </span>
          </div>

          {/* User Profile */}
          <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/5">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-white uppercase tracking-tight">{operatorEmail.split('@')[0]}</span>
                <span className="text-[8px] font-black text-[var(--em)] uppercase tracking-widest">Operator_A</span>
             </div>
             <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-black text-xs">
                {operatorEmail.charAt(0).toUpperCase()}
             </div>
          </div>

        </div>
      </div>
    </header>
  );
}
