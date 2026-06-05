const steps = [
  { n:'01', icon: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="2" width="20" height="15" rx="2"/><path d="M8 22h8M12 17v5"/>
    </svg>
  ), title:'Camera Monitors', desc:'Industrial cameras stream live video from all workspace zones continuously.' },
  { n:'02', icon: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="8" r="4"/><path d="M3 20c0-4.418 3.582-8 8-8s8 3.582 8 8"/><circle cx="11" cy="8" r="1.5" fill="currentColor"/>
    </svg>
  ), title:'YOLO Detects', desc:'YOLO v8 AI model identifies human presence in real time at the edge device.' },
  { n:'03', icon: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h4"/>
    </svg>
  ), title:'Zone Analysis', desc:'Virtual fence engine analyzes whether the person has entered a restricted zone.' },
  { n:'04', icon: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
    </svg>
  ), title:'Alert & Stop', desc:'Instant alert dispatched and machine shutdown triggered automatically on breach.' },
  { n:'05', icon: (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="2" width="12" height="20" rx="2"/><path d="M12 18h.01"/>
    </svg>
  ), title:'Dashboard Updates', desc:'Dashboard and mobile app receive live notification with event details instantly.' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section-pad" style={{background:'var(--graphite)'}}>
      <div className="section-inner">
        <div className="text-center mb-16 reveal">
          <div className="section-label mx-auto">How It Works</div>
          <h2 className="section-heading">Five Steps to<br/><span className="text-gradient">Zero Accidents</span></h2>
          <p className="section-sub mx-auto text-center">A clean automated pipeline from camera feed to machine protection.</p>
        </div>

        {/* Desktop horizontal */}
        <div className="hidden lg:flex items-start gap-0 reveal">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-start flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className="flex flex-col items-center text-center px-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300"
                    style={{background:'var(--graphite-card)', border:'1px solid var(--border-em)', color:'var(--em)'}}>
                    {s.icon}
                  </div>
                  <div className="text-[10px] font-black tracking-widest mb-1" style={{color:'var(--text-muted)'}}>STEP {s.n}</div>
                  <div className="text-[14px] font-bold text-white mb-2">{s.title}</div>
                  <div className="text-[12px] leading-relaxed" style={{color:'var(--text-sec)'}}>{s.desc}</div>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-shrink-0 mt-7 w-8 flex items-center">
                  <div className="w-full h-px" style={{background:'linear-gradient(90deg, var(--border-em), var(--border))'}}/>
                  <svg width="10" height="10" fill="none" stroke="var(--em)" strokeWidth="1.5" className="flex-shrink-0 -ml-0.5">
                    <path d="M2 5h6M5 2l3 3-3 3"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile vertical */}
        <div className="lg:hidden flex flex-col gap-4">
          {steps.map(s => (
            <div key={s.n} className="p-card p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{background:'var(--graphite-card)', border:'1px solid var(--border-em)', color:'var(--em)'}}>
                {s.icon}
              </div>
              <div>
                <div className="text-[10px] font-black tracking-widest mb-1" style={{color:'var(--text-muted)'}}>STEP {s.n}</div>
                <div className="text-[14px] font-bold text-white mb-1">{s.title}</div>
                <div className="text-[12px] leading-relaxed" style={{color:'var(--text-sec)'}}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
