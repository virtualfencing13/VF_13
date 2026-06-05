export default function LandingFooter() {
  const links = {
    Platform: ['Features','Dashboard','Analytics','Mobile App'],
    Technology: ['YOLO AI','Edge Processing','Multi-Camera','API Docs'],
    Company: ['About','Careers','Privacy Policy','Terms of Use'],
  };
  return (
    <footer style={{background:'var(--black)',borderTop:'1px solid var(--border)'}}>
      <div className="section-inner px-6 md:px-12 py-16">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:'var(--em)'}}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7L5.5 10.5L12 4" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-black text-white text-[15px]">AI Virtual<span style={{color:'var(--em)'}}>Fence</span></span>
            </div>
            <p className="text-[13px] leading-relaxed mb-5" style={{color:'var(--text-muted)'}}>
              Real-Time Industrial Safety<br/>Powered by Edge AI
            </p>
            <div className="flex items-center gap-2">
              {['twitter','linkedin','github','youtube'].map(s => (
                <a key={s} href="#" className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{background:'var(--graphite-card)',border:'1px solid var(--border)'}}
                  onMouseEnter={e => e.currentTarget.style.borderColor='var(--border-em)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                  <span className="text-xs capitalize" style={{color:'var(--text-muted)'}}>{s[0].toUpperCase()}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([cat, items]) => (
            <div key={cat}>
              <div className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{color:'var(--text-muted)'}}>{cat}</div>
              <div className="flex flex-col gap-2.5">
                {items.map(item => (
                  <a key={item} href="#" className="text-[13px] transition-colors duration-200" style={{color:'var(--text-sec)'}}
                    onMouseEnter={e => e.target.style.color='var(--em)'}
                    onMouseLeave={e => e.target.style.color='var(--text-sec)'}>{item}</a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8" style={{borderTop:'1px solid var(--border)'}}>
          <div className="text-[12px]" style={{color:'var(--text-muted)'}}>
            © 2026 AI VirtualFence. All rights reserved.
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full blink" style={{background:'var(--em)'}}/>
            <span className="text-[12px]" style={{color:'var(--text-muted)'}}>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
