const techs = [
  { name:'YOLO v8', desc:'Object Detection', icon:'🎯' },
  { name:'OpenCV', desc:'Computer Vision', icon:'👁' },
  { name:'Python', desc:'Core Backend', icon:'🐍' },
  { name:'Edge AI', desc:'Local Processing', icon:'⚡' },
  { name:'Raspberry Pi', desc:'Edge Hardware', icon:'🔷' },
  { name:'Jetson Nano', desc:'GPU Edge Device', icon:'🔲' },
  { name:'React Native', desc:'Mobile App', icon:'📱' },
  { name:'Node.js', desc:'API Layer', icon:'🟢' },
  { name:'PostgreSQL', desc:'Data Storage', icon:'🗄' },
];

export default function TechnologySection() {
  return (
    <section id="technology" className="section-pad" style={{background:'var(--black)'}}>
      <div className="section-inner">
        <div className="text-center mb-16 reveal">
          <div className="section-label mx-auto">Technology Stack</div>
          <h2 className="section-heading">Powered by<br/><span className="text-gradient">Industry Standards</span></h2>
          <p className="section-sub mx-auto text-center">Built on proven, enterprise-grade technologies for maximum reliability and performance.</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-4 reveal">
          {techs.map(({name,desc,icon}) => (
            <div key={name} className="tech-card group">
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{icon}</span>
              <div className="text-center">
                <div className="text-[12px] font-bold text-white">{name}</div>
                <div className="text-[10px] mt-0.5" style={{color:'var(--text-muted)'}}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Architecture note */}
        <div className="mt-12 p-6 rounded-2xl reveal" style={{background:'var(--graphite-card)',border:'1px solid var(--border)'}}>
          <div className="flex flex-wrap gap-6 justify-center items-center">
            {[
              {l:'Edge Processing',v:'Jetson Nano / RPi'},
              {l:'Detection Model',v:'YOLO v8'},
              {l:'Backend API',v:'Node.js + FastAPI'},
              {l:'Frontend',v:'React + Vite'},
              {l:'Mobile',v:'React Native'},
              {l:'Database',v:'PostgreSQL'},
            ].map(({l,v}) => (
              <div key={l} className="text-center">
                <div className="text-[10px] uppercase tracking-widest mb-1" style={{color:'var(--text-muted)'}}>{l}</div>
                <div className="text-[13px] font-semibold" style={{color:'var(--em)'}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
