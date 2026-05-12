import { Link, useLocation } from 'react-router-dom';

const items = [
  { id: 'dashboard', label: 'Dashboard', mobileLabel: 'Dashboard', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', path: '/' },
  { id: 'history', label: 'Alerts', mobileLabel: 'Alerts', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', path: '/alerts' },
  { id: 'analytics', label: 'Analytics', mobileLabel: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', path: '/analytics' },
  { id: 'cameras', label: 'Cameras', mobileLabel: 'Cameras', icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z', path: '/cameras' },
  { id: 'config', label: 'Settings', mobileLabel: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', path: '/settings' },
];

export default function Sidebar({ onLogout }) {
  const { pathname } = useLocation();

  return (
    <>
      {/* ── Desktop Sidebar (hidden on mobile) ─────────────────────── */}
      <aside className="hidden md:flex w-[280px] bg-[#0d1117] border-r border-white/5 flex-col p-6 h-full relative">
        
        {/* Brand */}
        <div className="flex items-center gap-3 mb-12 px-2">
          <div className="w-10 h-10 bg-[var(--green)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--green)]/20">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight leading-none text-white uppercase font-[var(--font-display)]">Virtual <span className="text-[var(--green)]">Fence</span></span>
            <span className="text-[9px] font-bold text-[#8b949e] tracking-[0.2em] uppercase mt-1 font-[var(--font-mono)]">Monitoring System</span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-2">
          {items.map(item => {
            const active = pathname === item.path;
            return (
              <Link 
                key={item.id} 
                to={item.path}
                className={`sidebar-item relative group/item ${active ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
                title={item.label}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {item.label}
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[var(--green)]' : 'bg-[var(--green)]/30'} shadow-[0_0_8px_rgba(0,255,65,0.3)]`} />
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Signout */}
        <div className="mt-auto">
          <button 
            onClick={onLogout}
            className="w-full h-12 rounded-xl border border-white/5 bg-white/2 hover:bg-red-500/10 hover:border-red-500/30 text-[#8b949e] hover:text-red-500 text-[12px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Signout
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation Bar ───────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d1117]/95 backdrop-blur-xl border-t border-[var(--green)]/10 flex items-stretch">
        {items.map(item => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 transition-all duration-200
                ${active ? 'text-[var(--green)]' : 'text-[#8b949e]'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all
                ${active ? 'bg-[var(--green)]/15 shadow-[0_0_10px_rgba(0,255,65,0.3)]' : ''}`}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest font-[var(--font-display)]">{item.mobileLabel}</span>
            </Link>
          );
        })}
        {/* Sign out tab */}
        <button
          onClick={onLogout}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-1 text-[#8b949e] hover:text-red-400 transition-all duration-200"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest font-[var(--font-display)]">Exit</span>
        </button>
      </nav>
    </>
  );
}
