export default function HeroSection({ onViewSystem, stats }) {
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden" style={{background:'var(--black)'}}>
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none"/>
      <div className="absolute inset-0 hero-radial pointer-events-none"/>
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{background:'linear-gradient(to top, var(--black), transparent)'}}/>

      <div className="section-inner section-pad relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* LEFT */}
          <div className="reveal">
            <div className="section-label mb-6">
              <span className="w-1.5 h-1.5 rounded-full blink" style={{background:'var(--em)'}}/>
              Real-Time Industrial Safety · Edge AI
            </div>
            <h1 className="section-heading text-5xl md:text-6xl lg:text-7xl mb-6">
              Prevent Industrial<br/>
              <span className="text-gradient">Accidents Before</span><br/>
              They Happen
            </h1>
            <p className="section-sub text-base md:text-lg mb-10 max-w-lg">
              AI-powered virtual fencing for real-time worker safety, intelligent monitoring, and automatic machine protection — deployed at the edge.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={onViewSystem} className="btn-em">
                View System
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5-5-5-5"/></svg>
              </button>
              <button onClick={() => document.getElementById('dashboard')?.scrollIntoView({behavior:'smooth'})} className="btn-ghost">
                Live Dashboard
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-12 pt-8" style={{borderTop:'1px solid var(--border)'}}>
              {[[stats?.accuracy || '99.8%','Detection Accuracy'],[stats?.latency || '<50ms','Response Time'],[stats?.uptime || '24/7','System Uptime'],[`${stats?.cameras || '10+'}`,'Camera Support']].map(([v,l]) => (
                <div key={l}>
                  <div className="text-2xl font-black" style={{color:'var(--em)'}}>{v}</div>
                  <div className="text-xs mt-1 font-medium" style={{color:'var(--text-muted)'}}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Dashboard Preview */}
          <div className="reveal reveal-delay-2">
            <div className="glass-card p-4 monitor-glow">
              {/* Header bar */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full blink" style={{background:'var(--em)'}}/>
                  <span className="text-[11px] font-semibold tracking-widest uppercase" style={{color:'var(--em)'}}>Live · CAM-01</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono" style={{color:'var(--text-muted)'}}>AI CONF: 97.4%</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase zone-safe">Secure</span>
                </div>
              </div>

              {/* Camera feed simulation */}
              <div className="relative rounded-xl overflow-hidden mb-3 shadow-inner" style={{background:'#0a0d10',aspectRatio:'16/9'}}>
                {/* Camera Image Feed */}
                <img src="/images/fence3.jpeg" alt="Live Detection Feed" className="absolute inset-0 w-full h-full object-cover" />
                
                <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none"/>
                <div className="scan-line pointer-events-none"/>

                {/* Overlays */}
                <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
                  <div className="flex gap-2">
                    <div className="rounded px-2 py-1 text-[9px] font-bold uppercase bg-black/40 backdrop-blur-sm border border-white/5 zone-safe">Zone A · Safe</div>
                  </div>

                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-mono bg-black/50 px-2 py-1 rounded backdrop-blur-sm border border-white/5" style={{color:'rgba(255,255,255,0.9)'}}>12:18:26 · 30fps</span>
                    <span className="text-[9px] font-mono bg-black/50 px-2 py-1 rounded backdrop-blur-sm border border-white/5" style={{color:'rgba(255,255,255,0.9)'}}>YOLO v8 · EDGE AI</span>
                  </div>
                </div>
              </div>

              {/* Bottom panels */}
              <div className="grid grid-cols-3 gap-2">
                {[{l:'DETECTED',v:'1',c:'var(--em)'},{l:'ALERTS',v:'0',c:'var(--text-sec)'},{l:'MACHINE',v:'RUN',c:'var(--em)'}].map(({l,v,c}) => (
                  <div key={l} className="rounded-xl p-3 text-center" style={{background:'var(--graphite-card)',border:'1px solid var(--border)'}}>
                    <div className="text-lg font-black" style={{color:c}}>{v}</div>
                    <div className="text-[9px] mt-0.5 font-semibold tracking-wider uppercase" style={{color:'var(--text-muted)'}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
