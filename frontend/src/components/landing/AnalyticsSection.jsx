import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const lineData = [
  {day:'Mon',v:12},{day:'Tue',v:19},{day:'Wed',v:8},{day:'Thu',v:25},{day:'Fri',v:14},{day:'Sat',v:6},{day:'Sun',v:10},
];
const barData = [
  {zone:'Zone A',alerts:5},{zone:'Zone B',alerts:18},{zone:'Zone C',alerts:11},{zone:'Entry',alerts:3},{zone:'Storage',alerts:7},
];
const areaData = [
  {t:'08:00',conf:91},{t:'09:00',conf:95},{t:'10:00',conf:93},{t:'11:00',conf:97},{t:'12:00',conf:98},{t:'13:00',conf:96},{t:'14:00',conf:99},
];
const pieData = [
  {name:'Safe',value:68,color:'#10b981'},
  {name:'Warning',value:22,color:'#f59e0b'},
  {name:'Danger',value:10,color:'#ef4444'},
];

const tipStyle = { background:'#0f1114', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px', fontSize:'11px', color:'#fff' };

export default function AnalyticsSection({ stats }) {
  return (
    <section id="analytics" className="section-pad" style={{background:'var(--black)'}}>
      <div className="section-inner">
        <div className="text-center mb-16 reveal">
          <div className="section-label mx-auto">Analytics</div>
          <h2 className="section-heading">Data-Driven<br/><span className="text-gradient">Safety Intelligence</span></h2>
          <p className="section-sub mx-auto text-center">Enterprise analytics that transform raw detection data into actionable safety insights.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 reveal">
          {[
            {l:'Total Detections',v:stats?.totalDetections || '4,821',d:'+12% vs last week',c:'var(--em)'},
            {l:'Active Alerts',v:stats?.activeAlerts || '0',d:'All systems nominal',c:'var(--em)'},
            {l:'System Uptime',v:stats?.uptime || '99.8%',d:'Last 30 days',c:'var(--em)'},
            {l:'Avg Response',v:stats?.latency || '42ms',d:'Detection to alert',c:'var(--em)'},
          ].map(({l,v,d,c}) => (
            <div key={l} className="p-card p-5">
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{color:'var(--text-muted)'}}>{l}</div>
              <div className="text-3xl font-black mb-1" style={{color:c}}>{v}</div>
              <div className="text-[11px]" style={{color:'var(--text-muted)'}}>{d}</div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Line chart */}
          <div className="p-card p-6 reveal">
            <div className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{color:'var(--text-muted)'}}>Daily Intrusion Detection</div>
            <div className="text-[13px] font-semibold text-white mb-4">Weekly Overview</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={lineData}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3"/>
                <XAxis dataKey="day" tick={{fill:'#475569',fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'#475569',fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={tipStyle}/>
                <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} dot={{fill:'#10b981',r:3}} activeDot={{r:5}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar chart */}
          <div className="p-card p-6 reveal reveal-delay-1">
            <div className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{color:'var(--text-muted)'}}>Zone-wise Alert Frequency</div>
            <div className="text-[13px] font-semibold text-white mb-4">By Safety Zone</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3"/>
                <XAxis dataKey="zone" tick={{fill:'#475569',fontSize:10}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'#475569',fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={tipStyle}/>
                <Bar dataKey="alerts" fill="#10b981" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Area chart */}
          <div className="p-card p-6 reveal reveal-delay-2">
            <div className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{color:'var(--text-muted)'}}>Detection Confidence Over Time</div>
            <div className="text-[13px] font-semibold text-white mb-4">AI Model Performance</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3"/>
                <XAxis dataKey="t" tick={{fill:'#475569',fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis domain={[85,100]} tick={{fill:'#475569',fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={tipStyle}/>
                <Area type="monotone" dataKey="conf" stroke="#10b981" strokeWidth={2} fill="url(#confGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Donut chart */}
          <div className="p-card p-6 reveal reveal-delay-3">
            <div className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{color:'var(--text-muted)'}}>Safety Status Distribution</div>
            <div className="text-[13px] font-semibold text-white mb-4">Safe / Warning / Danger Ratio</div>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry) => <Cell key={entry.name} fill={entry.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={tipStyle}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3">
                {pieData.map(({name,value,color}) => (
                  <div key={name} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{background:color}}/>
                    <div>
                      <div className="text-[12px] font-semibold text-white">{name}</div>
                      <div className="text-[11px]" style={{color:'var(--text-muted)'}}>{value}%</div>
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
