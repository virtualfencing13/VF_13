export default function ProblemSolution() {
  return (
    <section className="section-pad" style={{background:'var(--black)'}}>
      <div className="section-inner">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Problem */}
          <div className="p-card p-8 reveal">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'var(--danger-bg)',border:'1px solid var(--danger-border)'}}>
                <svg width="18" height="18" fill="none" stroke="var(--danger)" strokeWidth="2">
                  <path d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{color:'var(--danger)'}}>The Problem</div>
                <h3 className="text-xl font-black text-white">Human Supervision Fails</h3>
              </div>
            </div>
            <p className="text-[14px] leading-relaxed mb-6" style={{color:'var(--text-sec)'}}>
              Traditional CCTV systems require constant human monitoring and cannot automatically prevent industrial accidents. Fatigue, distraction, and delayed response cause critical failures.
            </p>
            <div className="flex flex-col gap-3">
              {['Manual monitoring is error-prone','No automated response capability','Delayed accident prevention','High operational labor cost'].map(p => (
                <div key={p} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:'var(--danger)'}}/>
                  <span className="text-[13px]" style={{color:'var(--text-sec)'}}>{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Solution */}
          <div className="p-card p-8 reveal reveal-delay-2" style={{borderColor:'var(--border-em)'}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'var(--em-glow)',border:'1px solid var(--border-em)'}}>
                <svg width="18" height="18" fill="none" stroke="var(--em)" strokeWidth="2">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{color:'var(--em)'}}>The Solution</div>
                <h3 className="text-xl font-black text-white">AI Virtual Fence</h3>
              </div>
            </div>
            <p className="text-[14px] leading-relaxed mb-6" style={{color:'var(--text-sec)'}}>
              Intelligent edge AI that monitors continuously, detects intrusions instantly, and triggers protective actions automatically — without any human intervention.
            </p>
            <div className="flex flex-col gap-3">
              {['Intelligent human detection via YOLO','Automated safety zone monitoring','Real-time alerts in under 50ms','Automatic machine shutdown on breach','Edge AI — no cloud dependency'].map(s => (
                <div key={s} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{background:'var(--em)'}}/>
                  <span className="text-[13px]" style={{color:'var(--text-sec)'}}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
