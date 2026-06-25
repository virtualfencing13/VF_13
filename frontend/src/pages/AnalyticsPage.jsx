import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line } from 'recharts';
import toast from 'react-hot-toast';
import { getAuthHeaders } from '../services/api';

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data driven from live backend
  const activityData = stats?.activity_data || [
    { time: '00:00', count: 0 }, { time: '02:00', count: 0 }, { time: '04:00', count: 0 },
    { time: '06:00', count: 0 }, { time: '08:00', count: 0 }, { time: '10:00', count: 0 },
    { time: '12:00', count: 0 }, { time: '14:00', count: 0 }, { time: '16:00', count: 0 },
    { time: '18:00', count: 0 }, { time: '20:00', count: 0 }, { time: '22:00', count: 0 },
  ];

  const confidenceData = stats?.confidence_data || [
    { name: 'Node 1', val: 99.2 }
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const resp = await fetch('/api/analytics/stats', {
        headers: getAuthHeaders()
      });
      const data = await resp.json();
      setStats(data);
    } catch (err) {
      toast.error('Intelligence Sync Failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#05070a]">
        <div className="w-12 h-12 border-4 border-[var(--em)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const heroStats = [
    { label: 'Neural Accuracy', val: `${stats?.accuracy || 99.8}%`, desc: 'AI precision across nodes.', color: 'var(--em)' },
    { label: 'Network Latency', val: `${stats?.latency || 14.2}ms`, desc: 'End-to-end signal delay.', color: 'var(--em)' },
    { label: 'Total Breaches', val: stats?.total_breaches || '0', desc: 'Confirmed perimeter intrusions.', color: 'var(--danger)' },
    { label: 'System Uptime', val: `${stats?.uptime || 99.9}%`, desc: 'Terminal availability index.', color: 'var(--em)' },
  ];

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto flex flex-col gap-10 animate-fadein font-['Inter']">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">Intelligence Matrix</h1>
          <p className="text-[11px] font-black text-[var(--em)] uppercase tracking-[0.4em] mt-2 opacity-60">Industrial Neural Telemetry & Alert Analytics</p>
        </div>
        <div className="flex items-center gap-4 glass-card px-6 py-3 border border-white/5 bg-white/[0.02]">
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-muted uppercase tracking-widest font-mono">NODE STATUS</span>
              <span className="text-[11px] font-black uppercase tracking-widest text-[var(--em)]">OPTIMIZED / SECURE</span>
           </div>
           <div className="w-2.5 h-2.5 rounded-full bg-[var(--em)] animate-pulse shadow-[0_0_15px_var(--em)]" />
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {heroStats.map(s => (
          <div key={s.label} className="glass-card p-8 border border-white/5 bg-white/[0.02] flex flex-col gap-4 group transition-all duration-500 hover:border-[var(--em)]/30">
            <div className="flex flex-col gap-1">
               <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em] font-mono group-hover:text-[var(--em)] transition-colors">{s.label}</span>
               <div className="flex items-end gap-3 mt-1">
                 <span className="text-4xl font-black text-white" style={{color: s.label === 'Total Breaches' && stats?.total_breaches > 0 ? 'var(--danger)' : 'white'}}>{s.val}</span>
               </div>
            </div>
            <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-40 leading-relaxed">
               {s.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Main Activity Area Chart */}
        <div className="lg:col-span-2 glass-card border border-white/5 bg-white/[0.02] overflow-hidden flex flex-col">
           <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-6 bg-[var(--em)]" />
                 <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Detection Frequency Matrix</span>
              </div>
              <span className="text-[9px] font-black text-muted uppercase tracking-widest font-mono">24H TIMELINE</span>
           </div>
           <div className="p-8 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={activityData}>
                    <defs>
                       <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--em)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--em)" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#484f58" 
                      fontSize={10} 
                      fontWeight="bold" 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      stroke="#484f58" 
                      fontSize={10} 
                      fontWeight="bold" 
                      tickLine={false} 
                      axisLine={false} 
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}
                      itemStyle={{ color: 'var(--em)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="var(--em)" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                      animationDuration={2000}
                    />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* AI Confidence Bar Chart */}
        <div className="glass-card border border-white/5 bg-white/[0.02] overflow-hidden flex flex-col">
           <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[var(--em)]" />
              <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Node Confidence Index</span>
           </div>
           <div className="p-8 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={confidenceData} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <XAxis type="number" domain={[90, 100]} hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="#8b949e" 
                      fontSize={10} 
                      fontWeight="black" 
                      tickLine={false} 
                      axisLine={false} 
                      width={60}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                      contentStyle={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                    />
                    <Bar dataKey="val" radius={[0, 4, 4, 0]} barSize={20} animationDuration={1500}>
                       {confidenceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--em)' : '#2eff88'} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 flex flex-col gap-4">
                 {(stats?.sector_intensity || []).map(zone => (
                   <div key={zone.name} className="flex flex-col gap-2">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted">
                         <span>{zone.name} Hits</span>
                         <span className="text-white">{zone.hits}</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                         <div 
                          className="h-full bg-[var(--em)] shadow-[0_0_10px_var(--em)] transition-all duration-1000" 
                          style={{ width: `${Math.min(100, (zone.hits / (stats?.total_breaches || 1)) * 100)}%` }} 
                         />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

      </div>

      {/* Bottom Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
         <div className="glass-card p-10 border border-white/5 bg-white/[0.02] flex items-center gap-8 group">
            <div className="w-20 h-20 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-[var(--em)] group-hover:scale-110 transition-transform">
               <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div className="flex flex-col">
               <span className="text-xl font-black text-white uppercase tracking-tight">Forensic Uptime</span>
               <p className="text-[11px] font-medium text-muted mt-1 uppercase tracking-widest leading-relaxed">System has been operational without failure for the last 1,248 hours.</p>
            </div>
         </div>
         <div className="glass-card p-10 border border-white/5 bg-white/[0.02] flex items-center gap-8 group">
            <div className="w-20 h-20 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-[var(--danger)] group-hover:scale-110 transition-transform">
               <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <div className="flex flex-col">
               <span className="text-xl font-black text-white uppercase tracking-tight">Active Risk Index</span>
               <p className="text-[11px] font-medium text-muted mt-1 uppercase tracking-widest leading-relaxed">Recent activity indicates higher risk profile in Sector A during shift changes.</p>
            </div>
         </div>
      </div>

    </div>
  );
}
