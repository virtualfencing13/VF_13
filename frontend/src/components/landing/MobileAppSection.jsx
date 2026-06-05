export default function MobileAppSection() {
  const appAlerts = [
    {icon:'🚨',title:'Zone B Intrusion',sub:'Restricted area breach detected',time:'now',c:'var(--danger)'},
    {icon:'⚡',title:'Machine Stopped',sub:'Emergency shutdown triggered',time:'1m ago',c:'var(--warning)'},
    {icon:'✅',title:'System Resumed',sub:'All zones clear and secure',time:'3m ago',c:'var(--em)'},
  ];
  return (
    <section id="mobile-app" className="section-pad" style={{background:'var(--graphite)'}}>
      <div className="section-inner">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left text */}
          <div className="reveal">
            <div className="section-label">Mobile App</div>
            <h2 className="section-heading">Safety in<br/><span className="text-gradient">Your Pocket</span></h2>
            <p className="section-sub mb-8">Monitor your entire facility from anywhere. Receive instant alerts, manage zones, and control your safety system remotely with the AI VirtualFence mobile app.</p>
            <div className="flex flex-col gap-4">
              {[
                {icon:'📹',t:'Live CCTV Access',d:'View all camera feeds in real time from your phone.'},
                {icon:'🔔',t:'Instant Push Alerts',d:'Receive emergency notifications the moment a breach occurs.'},
                {icon:'🗺',t:'Remote Zone Management',d:'Create, edit, and manage virtual fence zones remotely.'},
                {icon:'📊',t:'Safety Analytics',d:'Review historical data and safety trends on the go.'},
              ].map(({icon,t,d}) => (
                <div key={t} className="flex items-start gap-4 p-4 rounded-xl transition-all duration-300" style={{background:'var(--graphite-card)',border:'1px solid var(--border)'}}>
                  <span className="text-xl flex-shrink-0">{icon}</span>
                  <div>
                    <div className="text-[14px] font-semibold text-white mb-0.5">{t}</div>
                    <div className="text-[12px]" style={{color:'var(--text-sec)'}}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — phone mockup */}
          <div className="flex justify-center reveal reveal-delay-2">
            <div className="phone-frame w-72 p-3" style={{maxWidth:'280px'}}>
              {/* Notch */}
              <div className="flex justify-center mb-3">
                <div className="w-24 h-5 rounded-full" style={{background:'var(--graphite-light)'}}/>
              </div>

              {/* App UI */}
              <div className="rounded-3xl overflow-hidden" style={{background:'var(--black)'}}>
                {/* Header */}
                <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{borderBottom:'1px solid var(--border)'}}>
                  <div>
                    <div className="text-[12px] font-black text-white">VirtualFence</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full blink" style={{background:'var(--em)'}}/>
                      <span className="text-[9px]" style={{color:'var(--em)'}}>All Systems Active</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'var(--em-glow)',border:'1px solid var(--border-em)'}}>
                    <span className="text-sm">🔔</span>
                  </div>
                </div>

                {/* Mini camera */}
                <div className="mx-3 mt-3 rounded-xl overflow-hidden relative" style={{aspectRatio:'16/9',background:'#0a0d10'}}>
                  <div className="absolute inset-0 grid-bg opacity-40"/>
                  <div className="scan-line"/>
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full" style={{background:'var(--danger)'}}/>
                    <span className="text-[7px] font-mono text-white">REC · CAM-01</span>
                  </div>
                  <div className="absolute top-6 left-5 w-8 h-12 rounded" style={{border:'1.5px solid var(--em)'}}/>
                  <div className="absolute bottom-2 right-2 text-[7px] font-mono" style={{color:'rgba(255,255,255,0.4)'}}>YOLO · 97%</div>
                </div>

                {/* Alert list */}
                <div className="px-3 pt-3 pb-4">
                  <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{color:'var(--text-muted)'}}>Recent Alerts</div>
                  {appAlerts.map(({icon,title,sub,time,c}) => (
                    <div key={title} className="flex items-center gap-3 py-2.5" style={{borderBottom:'1px solid var(--border)'}}>
                      <span className="text-base">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold truncate" style={{color:c}}>{title}</div>
                        <div className="text-[9px] truncate" style={{color:'var(--text-muted)'}}>{sub}</div>
                      </div>
                      <span className="text-[9px] flex-shrink-0" style={{color:'var(--text-muted)'}}>{time}</span>
                    </div>
                  ))}
                </div>

                {/* Bottom nav */}
                <div className="flex justify-around py-3 mx-3 mb-2 rounded-2xl" style={{background:'var(--graphite-card)',border:'1px solid var(--border)'}}>
                  {['🏠','📹','🚨','📊','⚙️'].map(ic => (
                    <button key={ic} className="text-lg p-1">{ic}</button>
                  ))}
                </div>
              </div>

              {/* Home bar */}
              <div className="flex justify-center mt-3">
                <div className="w-20 h-1 rounded-full" style={{background:'rgba(255,255,255,0.15)'}}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
