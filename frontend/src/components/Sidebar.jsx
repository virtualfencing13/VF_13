import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const items = [
  { id: 'dashboard', label: 'Dashboard', mobileLabel: 'Home', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z', path: '/dashboard' },
  { id: 'alerts', label: 'Alerts', mobileLabel: 'Alerts', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', path: '/alerts' },
  { id: 'analytics', label: 'Analytics', mobileLabel: 'Stats', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', path: '/analytics' },
  { id: 'cameras', label: 'Cameras', mobileLabel: 'Cams', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', path: '/cameras' },
  { id: 'reports', label: 'Reports', mobileLabel: 'Logs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', path: '/reports' },
  { id: 'settings', label: 'Settings', mobileLabel: 'Config', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', path: '/settings' },
];

export default function Sidebar({ onLogout, isCollapsed, setIsCollapsed }) {
  const { pathname } = useLocation();
  const [operatorEmail, setOperatorEmail] = useState('Authorized Node');
  const [operatorRole, setOperatorRole] = useState('operator');

  useEffect(() => {
    const email = sessionStorage.getItem('operator_email');
    if (email) setOperatorEmail(email);
    const role = sessionStorage.getItem('operator_role');
    if (role) setOperatorRole(role);
  }, []);

  return (
    <>
      {/* ── Desktop Sidebar ────────────────────────────────────────── */}
      <aside className={`hidden md:flex flex-col h-full bg-[#0d1117] border-r border-white/5 relative z-50 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
        ${isCollapsed ? 'w-[100px]' : 'w-[280px]'}`}>
        
        {/* Brand Section & Toggle */}
        <div className={`p-6 mb-4 flex items-center transition-all duration-500 ${isCollapsed ? 'flex-col gap-6' : 'justify-between'}`}>
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-10 h-10 bg-[var(--em)] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:rotate-12 transition-transform duration-500 shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-fadein">
                <span className="text-lg font-black text-white tracking-tighter uppercase leading-none">Fence<span className="text-[var(--em)]">AI</span></span>
                <span className="text-[9px] font-black text-[var(--em)] tracking-[0.3em] uppercase mt-1 opacity-60">Control Center</span>
              </div>
            )}
          </div>

          {/* Toggle Button Inside Sidebar */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 hover:bg-[var(--em)]/10 hover:border-[var(--em)]/20
              ${isCollapsed ? 'mt-2' : ''}`}
          >
            <div className={`w-5 h-0.5 bg-white transition-all duration-500 ${isCollapsed ? 'rotate-45 translate-y-2' : ''}`} />
            <div className={`w-5 h-0.5 bg-white transition-all duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-40'}`} />
            <div className={`w-5 h-0.5 bg-white transition-all duration-500 ${isCollapsed ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 space-y-1">
          {!isCollapsed && <div className="text-[9px] font-black text-muted uppercase tracking-[0.3em] px-4 mb-4 opacity-40 animate-fadein">Operational Systems</div>}
          {items
            .concat(operatorRole === 'admin' ? [{ id: 'admin', label: 'Admin Console', mobileLabel: 'Admin', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', path: '/admin' }] : [])
            .map(item => {
              const active = pathname === item.path || (item.id === 'zones' && pathname === '/dashboard' && window.location.search.includes('mode=zones'));
              return (
                <Link 
                  key={item.id} 
                  to={item.path}
                  title={isCollapsed ? item.label : ''}
                  className={`flex items-center rounded-2xl transition-all duration-300 group
                    ${isCollapsed ? 'justify-center p-3.5' : 'justify-between px-4 py-3.5'}
                    ${active ? 'bg-[var(--em)]/10 text-[var(--em)] shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]' : 'text-muted hover:text-white hover:bg-white/[0.02]'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`transition-all duration-300 ${active ? 'scale-110 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'group-hover:scale-110'}`}>
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d={item.icon} />
                      </svg>
                    </div>
                    {!isCollapsed && <span className={`text-[12px] font-black uppercase tracking-widest animate-fadein ${active ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>{item.label}</span>}
                  </div>
                  {!isCollapsed && active && <div className="w-1.5 h-1.5 bg-[var(--em)] rounded-full shadow-[0_0_10px_var(--em)]" />}
                </Link>
              );
            })}
        </nav>

        {/* User Profile & Footer */}
        <div className="p-4 space-y-4">
          <div className={`bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4 group transition-all duration-500 ${isCollapsed ? 'justify-center p-3' : 'p-4'}`}>
            {sessionStorage.getItem('operator_picture') ? (
              <img src={sessionStorage.getItem('operator_picture')} className="w-10 h-10 rounded-full border border-[var(--em)]/30 shrink-0" alt="Avatar" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center text-[var(--em)] font-black text-xs shrink-0">
                {operatorEmail.charAt(0).toUpperCase()}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 animate-fadein">
                <span className="text-[11px] font-black text-white uppercase truncate">{sessionStorage.getItem('operator_name') || operatorEmail.split('@')[0]}</span>
                <span className="text-[9px] font-black text-[var(--em)] uppercase tracking-widest opacity-60">Verified {operatorRole}</span>
              </div>
            )}
          </div>

          <button 
            onClick={onLogout}
            title={isCollapsed ? 'Deauthorize' : ''}
            className={`w-full bg-white/[0.03] hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 text-muted hover:text-red-500 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 font-black uppercase tracking-[0.2em]
              ${isCollapsed ? 'h-12' : 'h-14 text-[11px]'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {!isCollapsed && <span className="animate-fadein">Deauthorize</span>}
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation ──────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] h-20 bg-[#0d1117]/95 backdrop-blur-2xl border-t border-white/5 px-2 flex items-center justify-around">
        {items.slice(0, 5).map(item => {
          const active = pathname === item.path;
          return (
            <Link 
              key={item.id} 
              to={item.path}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${active ? 'text-[var(--em)]' : 'text-muted'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-[var(--em)]/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : ''}`}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest">{item.mobileLabel}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
