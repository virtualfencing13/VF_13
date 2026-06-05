export default function DashboardSection({ stats }) {
  const alerts = [
    {time:'12:17:52',msg:'Zone B Intrusion',type:'danger'},
    {time:'12:17:53',msg:'Machine Emergency Stop',type:'danger'},
    {time:'12:17:54',msg:'Machine Halted',type:'warning'},
    {time:'12:18:10',msg:'Zone Cleared',type:'safe'},
    {time:'12:18:26',msg:'System Resumed',type:'safe'},
  ];
  return (
    <section id="dashboard" className="section-pad" style={{background:'var(--graphite)'}}>
      <div className="section-inner">
        <div className="text-center mb-16 reveal">
          <div className="section-label mx-auto">Dashboard</div>
          <h2 className="section-heading">Enterprise Control<br/><span className="text-gradient">Centre</span></h2>
          <p className="section-sub mx-auto text-center">A unified industrial monitoring dashboard providing complete visibility and control.</p>
        </div>

        {/* Dashboard mockup */}
        <div className="glass-card p-6 monitor-glow reveal">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-5 pb-4" style={{borderBottom:'1px solid var(--border)'}}>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{background:'var(--em)'}}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#000" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </div>
              <span className="font-bold text-white text-[14px]">AI VirtualFence · Control Centre</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono" style={{color:'var(--text-muted)'}}>12:18:26</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg zone-safe">
                <div className="w-1.5 h-1.5 rounded-full blink" style={{background:'var(--em)'}}/>
                <span className="text-[10px] font-bold uppercase">All Systems Nominal</span>
              </div>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {[
              {l:'Active Cameras',v:`${stats?.cameras || '4'} / 4`,c:'var(--em)'},
              {l:'Persons Detected',v:'3',c:'var(--text-pri)'},
              {l:'Active Alerts',v:stats?.activeAlerts || '0',c:stats?.activeAlerts > 0 ? 'var(--danger)' : 'var(--em)'},
              {l:'Machine Status',v:stats?.machineStatus || 'Running',c:stats?.machineStatus === 'Running' ? 'var(--em)' : 'var(--warning)'},
            ].map(({l,v,c}) => (
              <div key={l} className="rounded-xl p-4" style={{background:'var(--graphite-card)',border:'1px solid var(--border)'}}>
                <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{color:'var(--text-muted)'}}>{l}</div>
                <div className="text-2xl font-black" style={{color:c}}>{v}</div>
              </div>
            ))}
          </div>

          {/* Main content grid */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Camera feeds */}
            <div className="lg:col-span-2 rounded-xl p-4" style={{background:'var(--graphite-card)',border:'1px solid var(--border)'}}>
              <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{color:'var(--text-muted)'}}>Camera Grid</div>
              <div className="grid grid-cols-2 gap-3">
                {[{id:'CAM-01',zone:'Zone A',s:'safe'},{id:'CAM-02',zone:'Zone B',s:'warning'},{id:'CAM-03',zone:'Zone C',s:'safe'},{id:'CAM-04',zone:'Entry',s:'safe'}].map(({id,zone,s}) => (
                  <div key={id} className="relative rounded-lg overflow-hidden" style={{background:'#0a0d10',aspectRatio:'16/9'}}>
                    <div className="absolute inset-0 grid-bg opacity-30"/>
                    <div className="scan-line" style={{animationDuration: `${4 + Math.random()*2}s`}}/>
                    <div className="absolute top-1.5 left-2 flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full" style={{background: s==='safe' ? 'var(--em)' : 'var(--warning)'}}/>
                      <span className="text-[8px] font-mono text-white">{id}</span>
                    </div>
                    <div className="absolute bottom-1.5 left-2">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${s==='safe'?'zone-safe':'zone-warning'}`}>{zone}</span>
                    </div>
                    {s==='warning' && (
                      <div className="absolute top-4 left-6 w-8 h-14 rounded" style={{border:'1.5px solid var(--em)'}}/>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Alert log + health */}
            <div className="flex flex-col gap-4">
              <div className="rounded-xl p-4 flex-1" style={{background:'var(--graphite-card)',border:'1px solid var(--border)'}}>
                <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{color:'var(--text-muted)'}}>Event Log</div>
                <div className="flex flex-col gap-0">
                  {alerts.map(({time,msg,type}) => (
                    <div key={time} className="flex items-start gap-2 py-2" style={{borderBottom:'1px solid var(--border)'}}>
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{background:type==='safe'?'var(--em)':type==='warning'?'var(--warning)':'var(--danger)'}}/>
                      <div>
                        <div className="text-[11px] font-semibold text-white">{msg}</div>
                        <div className="text-[9px] font-mono" style={{color:'var(--text-muted)'}}>{time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl p-4" style={{background:'var(--graphite-card)',border:'1px solid var(--border)'}}>
                <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{color:'var(--text-muted)'}}>System Health</div>
                {[{l:'AI Engine',v:98},{l:'Edge CPU',v:74},{l:'Network',v:95}].map(({l,v}) => (
                  <div key={l} className="mb-2.5">
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px]" style={{color:'var(--text-sec)'}}>{l}</span>
                      <span className="text-[11px] font-bold" style={{color:'var(--em)'}}>{v}%</span>
                    </div>
                    <div className="h-1 rounded-full" style={{background:'var(--graphite-light)'}}>
                      <div className="h-full rounded-full" style={{width:`${v}%`,background:'var(--em)'}}/>
                    </div>
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
