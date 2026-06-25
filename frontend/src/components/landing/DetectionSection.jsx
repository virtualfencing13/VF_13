export default function DetectionSection({ stats }) {
  return (
    <section id="features" className="section-pad" style={{background:'var(--graphite)'}}>
      <div className="section-inner">
        <div className="text-center mb-12 reveal">
          <div className="section-label mx-auto">Live AI Detection</div>
          <h2 className="section-heading">Real-Time Industrial<br/><span className="text-gradient">Monitoring Interface</span></h2>
          <p className="section-sub mx-auto text-center">Enterprise-grade CCTV monitoring with automatic zone analysis and AI-driven intrusion detection.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 items-start">
          {/* Main Monitor */}
          <div className="lg:col-span-3 reveal">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full blink" style={{background:'var(--em)'}}/>
                  <span className="text-[12px] font-bold uppercase tracking-widest" style={{color:'var(--em)'}}>Live Detection Feed</span>
                </div>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold zone-safe">System Active</span>
                </div>
              </div>

              {/* Main feed */}
              <div className="relative rounded-xl overflow-hidden mb-4 shadow-inner" style={{background:'#080b0e', aspectRatio:'16/9'}}>
                {/* Camera Image Feed */}
                <img src="/images/fence2.jpeg" alt="Live Detection Feed" className="absolute inset-0 w-full h-full object-cover" />
                
                {/* Cyber Overlays */}
                <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none"/>
                <div className="scan-line pointer-events-none"/>
                
                {/* Timestamp */}
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/40 px-2 py-1 rounded backdrop-blur-sm border border-white/5">
                  <div className="w-1.5 h-1.5 rounded-full blink" style={{background:'var(--danger)'}}/>
                  <span className="text-[9px] font-mono font-bold" style={{color:'rgba(255,255,255,0.9)'}}>REC · 12:18:26</span>
                </div>

                {/* Tech Specs */}
                <div className="absolute bottom-3 left-3 text-[8px] font-mono font-bold bg-black/60 px-2 py-1.5 rounded backdrop-blur-sm border border-white/5" style={{color:'rgba(255,255,255,0.8)'}}>YOLO v8 · 30fps · Edge AI</div>
              </div>

              {/* Zone status row */}
              <div className="grid grid-cols-3 gap-3">
                {[{z:'Zone A',s:'Safe',c:'zone-safe'},{z:'Zone B',s:'Warning',c:'zone-warning'},{z:'Zone C',s:'Clear',c:'zone-safe'}].map(({z,s,c}) => (
                  <div key={z} className={`rounded-xl p-3 flex items-center justify-between ${c}`}>
                    <span className="text-[11px] font-semibold">{z}</span>
                    <span className="text-[10px] font-bold uppercase">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panels */}
          <div className="lg:col-span-2 flex flex-col gap-4 reveal reveal-delay-2">
            {/* Alert log */}
            <div className="glass-card p-4">
              <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{color:'var(--text-muted)'}}>Alert Log</div>
              <div className="flex flex-col gap-2">
                {[
                  {t:'Zone B Intrusion',s:'Warning',c:'zone-warning',time:'12:17:52'},
                  {t:'Emergency Stop',s:'Triggered',c:'zone-danger',time:'12:17:53'},
                  {t:'Machine Halted',s:'Safe',c:'zone-safe',time:'12:17:54'},
                  {t:'Zone Cleared',s:'Resolved',c:'zone-safe',time:'12:18:10'},
                ].map(({t,s,c,time}) => (
                  <div key={time} className="flex items-center justify-between py-2" style={{borderBottom:'1px solid var(--border)'}}>
                    <div>
                      <div className="text-[12px] font-semibold text-white">{t}</div>
                      <div className="text-[10px] font-mono mt-0.5" style={{color:'var(--text-muted)'}}>{time}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c}`}>{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* System Health */}
            <div className="glass-card p-4">
              <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{color:'var(--text-muted)'}}>System Health</div>
              {[{l:'Detection Engine',v:98},{l:'Edge Processor',v:92},{l:'Network Latency',v:88},{l:'Camera Feed',v:100}].map(({l,v}) => (
                <div key={l} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] font-medium" style={{color:'var(--text-sec)'}}>{l}</span>
                    <span className="text-[11px] font-bold" style={{color:'var(--em)'}}>{v}%</span>
                  </div>
                  <div className="h-1 rounded-full" style={{background:'var(--graphite-light)'}}>
                    <div className="h-full rounded-full transition-all" style={{width:`${v}%`, background:'var(--em)'}}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Emergency status */}
            <div className="rounded-xl p-4 flex items-center gap-3" style={{background:'rgba(16,185,129,0.06)',border:'1px solid var(--border-em)'}}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'var(--em)'}}>
                <svg width="18" height="18" fill="none" stroke="#000" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
              </div>
              <div>
                <div className="text-[13px] font-bold text-white">Machine Protected</div>
                <div className="text-[11px] mt-0.5" style={{color:'var(--text-muted)'}}>Auto-shutdown armed · Response &lt;50ms</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
