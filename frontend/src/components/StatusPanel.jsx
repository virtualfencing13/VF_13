export default function StatusPanel({ status, alerts, zones, connected }) {
  const isIntrusion = status?.status === 'intrusion';
  const personCount = status?.personCount || 0;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Real-time Diagnostics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#05070a] p-4 rounded-xl border border-white/5 flex flex-col">
          <span className="text-[10px] font-black text-[#0e8c45] uppercase tracking-widest mb-2">IO Link</span>
          <div className="flex items-center gap-2">
             <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-[#1ed670] pulse-ring' : 'bg-red-500'}`} />
             <span className={`text-[11px] font-black uppercase tracking-tighter ${connected ? 'text-white' : 'text-red-500'}`}>
               {connected ? 'CONNECTED' : 'OFFLINE'}
             </span>
          </div>
        </div>
        
        <div className="bg-[#05070a] p-4 rounded-xl border border-white/5 flex flex-col">
          <span className="text-[10px] font-black text-[#0e8c45] uppercase tracking-widest mb-2">Threat Vector</span>
          <div className="flex items-center gap-2">
             <div className={`w-1.5 h-1.5 rounded-full ${isIntrusion ? 'bg-[#f85149] animate-ping' : 'bg-[#1ed670]'}`} />
             <span className={`text-[11px] font-black uppercase tracking-tighter ${isIntrusion ? 'text-[#f85149]' : 'text-white'}`}>
               {isIntrusion ? 'BREACH' : 'ALL_CLEAR'}
             </span>
          </div>
        </div>
      </div>

      {/* Advanced Metrics */}
      <div className="flex flex-col gap-4 pt-2">
         <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#8b949e]">
            <span>Neural Occupancy</span>
            <span className="text-white font-mono">{personCount} OBJECTS</span>
         </div>
         <div className="w-full h-1.5 bg-[#05070a] rounded-full overflow-hidden border border-white/5">
            <div 
              className={`h-full transition-all duration-700 ${isIntrusion ? 'bg-[#f85149]' : 'bg-[#1ed670]'}`}
              style={{ width: `${Math.min((personCount / 5) * 100, 100)}%` }}
            />
         </div>
         
         <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#8b949e] mt-2">
            <span>Buffer Integrity</span>
            <span className="text-[#1ed670] font-mono">99.8%</span>
         </div>
         <div className="w-full h-1.5 bg-[#05070a] rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-[#1ed670]/40 w-[99.8%]" />
         </div>
      </div>

      {/* Metadata Footnote */}
      <div className="mt-4 pt-6 border-t border-white/5 flex flex-col gap-2">
         <div className="flex justify-between items-center text-[10px] font-mono font-bold text-[#484f58]">
            <span className="uppercase">Core Load</span>
            <span className="text-white">12.4%</span>
         </div>
         <div className="flex justify-between items-center text-[10px] font-mono font-bold text-[#484f58]">
            <span className="uppercase">Secure Tunnel</span>
            <span className="text-[#1ed670]">AES-256</span>
         </div>
      </div>

    </div>
  );
}
