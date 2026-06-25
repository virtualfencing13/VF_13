import { useState, useEffect } from 'react';

const navLinks = ['Home','Features','How It Works','Analytics','Mobile App'];

import { useNavigate } from 'react-router-dom';

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id.toLowerCase().replaceAll(' ','-'));
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:'var(--em)'}}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7L5.5 10.5L12 4" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-black text-white text-[15px] tracking-tight">AI Virtual<span style={{color:'var(--em)'}}>Fence</span></span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(l => (
            <button key={l} onClick={() => scrollTo(l)}
              className="px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200"
              style={{color:'var(--text-sec)'}}
              onMouseEnter={e => e.target.style.color='#fff'}
              onMouseLeave={e => e.target.style.color='var(--text-sec)'}>
              {l}
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button 
            onClick={() => navigate('/login')} 
            className="text-[13px] font-black uppercase tracking-widest text-white/60 hover:text-white px-4 transition-colors"
          >
            Login
          </button>
          <button onClick={() => scrollTo('Contact')} className="btn-em text-[13px] px-5 py-2.5">
            Contact Team
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5-5-5-5"/></svg>
          </button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-white p-2" onClick={() => setMenuOpen(!menuOpen)}>
          <div className="w-5 flex flex-col gap-1.5">
            <span className={`block h-px bg-white transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}/>
            <span className={`block h-px bg-white transition-all ${menuOpen ? 'opacity-0' : ''}`}/>
            <span className={`block h-px bg-white transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}/>
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t px-6 py-4 flex flex-col gap-1" style={{background:'rgba(8,10,12,0.97)',borderColor:'var(--border)'}}>
          {navLinks.map(l => (
            <button key={l} onClick={() => scrollTo(l)}
              className="text-left py-2.5 text-[14px] font-medium transition-colors"
              style={{color:'var(--text-sec)'}}>{l}</button>
          ))}
          <button onClick={() => scrollTo('Contact')} className="btn-em mt-3 w-full justify-center">Contact Team</button>
        </div>
      )}
    </nav>
  );
}
