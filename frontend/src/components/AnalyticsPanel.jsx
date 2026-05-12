import { useMemo } from 'react';

function BarChart({ data, color }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-32 w-full pt-4">
      {data.map((d, i) => {
        const h = (d.value / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
            <div className="relative w-full bg-[#161b22] rounded-t-sm overflow-hidden" style={{ height: '100%' }}>
              <div 
                className={`absolute bottom-0 w-full transition-all duration-500 ${color}`} 
                style={{ height: `${h}%` }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white text-black text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {d.value} events
              </div>
            </div>
            <span className="text-[8px] font-mono text-[#484f58] uppercase truncate w-full text-center">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPanel({ alerts = [] }) {
  const stats = useMemo(() => {
    const now = new Date();
    const today = alerts.filter(a => new Date(a.timestamp).toDateString() === now.toDateString());
    
    // Most violated zone
    const zones = {};
    today.forEach(a => {
      const name = a.zone_name || 'Unknown';
      zones[name] = (zones[name] || 0) + 1;
    });
    const mostViolated = Object.entries(zones).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

    // Hourly distribution
    const hours = Array(12).fill(0).map((_, i) => ({ label: `${i*2}h`, value: 0 }));
    today.forEach(a => {
      const h = new Date(a.timestamp).getHours();
      const idx = Math.floor(h / 2);
      if (hours[idx]) hours[idx].value++;
    });

    return {
      totalToday: today.length,
      mostViolated: mostViolated[0],
      mostViolatedCount: mostViolated[1],
      hourly: hours
    };
  }, [alerts]);

  return (
    <div className="flex flex-col gap-6">
      
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#161b22] p-4 rounded-xl border border-[#30363d]/50">
          <div className="text-[10px] font-black text-[#484f58] uppercase tracking-widest mb-1">Daily Total</div>
          <div className="text-2xl font-mono font-black text-white">{stats.totalToday}</div>
          <div className="text-[9px] text-[#238636] font-bold mt-1 uppercase">↑ Incidents Today</div>
        </div>
        <div className="bg-[#161b22] p-4 rounded-xl border border-[#30363d]/50">
          <div className="text-[10px] font-black text-[#484f58] uppercase tracking-widest mb-1">Top Vector</div>
          <div className="text-[13px] font-bold text-[#f85149] truncate uppercase">{stats.mostViolated}</div>
          <div className="text-[9px] text-[#484f58] font-bold mt-1 uppercase">{stats.mostViolatedCount} Breach Attempts</div>
        </div>
      </div>

      {/* Hourly Chart */}
      <div className="bg-[#0d1117]/50 p-4 rounded-xl border border-[#30363d]/30">
        <div className="flex items-center justify-between mb-4">
           <div className="text-[10px] font-black text-white uppercase tracking-widest">Breach Histogram</div>
           <div className="text-[9px] font-mono text-[#484f58]">24H DISTRIBUTION</div>
        </div>
        <BarChart data={stats.hourly} color="bg-gradient-to-t from-[#238636] to-[#3fb950]" />
      </div>

      {/* Security Level Distribution (Mock or simple calc) */}
      <div className="flex flex-col gap-2">
         <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-[#8b949e]">Risk Profile</span>
            <span className="text-white">Live Audit</span>
         </div>
         <div className="flex h-2 rounded-full overflow-hidden bg-[#161b22]">
            <div className="h-full bg-[#f85149]" style={{ width: '65%' }} />
            <div className="h-full bg-[#e3b341]" style={{ width: '25%' }} />
            <div className="h-full bg-[#3fb950]" style={{ width: '10%' }} />
         </div>
         <div className="flex justify-between items-center text-[8px] font-bold uppercase text-[#484f58] px-1">
            <span>Critical</span>
            <span>Warning</span>
            <span>Safe</span>
         </div>
      </div>

    </div>
  );
}
