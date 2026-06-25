const features = [
  { icon: '👁', title:'Real-Time Human Detection', desc:'YOLO v8 identifies workers instantly with 99.8% accuracy at the edge.' },
  { icon: '🛡', title:'Smart Virtual Fencing', desc:'Define custom restricted zones with polygon-based boundary configuration.' },
  { icon: '⚡', title:'Automatic Machine Shutdown', desc:'Machines halt within 50ms of intrusion detection — zero human delay.' },
  { icon: '📹', title:'Live CCTV Monitoring', desc:'Multi-camera live feed with AI overlays, detection boxes, and zone indicators.' },
  { icon: '🚨', title:'Instant Emergency Alerts', desc:'Push notifications, dashboard alerts, and mobile warnings trigger simultaneously.' },
  { icon: '🔷', title:'Edge AI Processing', desc:'All processing runs locally on Jetson Nano or Raspberry Pi — no cloud required.' },
  { icon: '📱', title:'Mobile App Integration', desc:'iOS and Android app for remote monitoring, alerts, and zone management.' },
  { icon: '📊', title:'Safety Analytics', desc:'Historical intrusion data, zone frequency heatmaps, and safety trend charts.' },
  { icon: '⏱', title:'Low Latency Detection', desc:'Sub-50ms end-to-end detection-to-alert pipeline for critical safety response.' },
  { icon: '🎥', title:'Multi-Camera Support', desc:'Connect and manage up to 10+ cameras from a single unified dashboard.' },
];

export default function FeaturesSection() {
  return (
    <section className="section-pad" style={{background:'var(--black)'}}>
      <div className="section-inner">
        <div className="text-center mb-16 reveal">
          <div className="section-label mx-auto">Platform Features</div>
          <h2 className="section-heading">Built for<br/><span className="text-gradient">Industrial Scale</span></h2>
          <p className="section-sub mx-auto text-center">Every feature engineered for real-world factory safety and enterprise reliability.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {features.map((f, i) => (
            <div key={f.title} className="feat-card reveal" style={{transitionDelay:`${i * 40}ms`}}>
              <div className="text-2xl mb-4">{f.icon}</div>
              <h3 className="text-[14px] font-bold text-white mb-2 leading-snug">{f.title}</h3>
              <p className="text-[12px] leading-relaxed" style={{color:'var(--text-sec)'}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
