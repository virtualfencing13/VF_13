import { useState } from 'react';
import { toggleMachineControl, resetMachine } from '../services/api';

export default function MachineControl({ status, enabled }) {
  const [loading, setLoading] = useState(false);
  const isStopped = status === 'stopped';

  const handleToggle = async () => {
    setLoading(true);
    try {
      await toggleMachineControl(!enabled);
    } catch {
      alert('Action failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await resetMachine();
    } catch {
      alert('Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Simulation Banner */}
      <div className={`bg-[#05070a] p-5 rounded-2xl border border-white/5 flex items-center justify-between transition-all duration-700
        ${isStopped ? 'shadow-[inset_0_0_20px_rgba(248,81,73,0.1)] border-[#f85149]/30' : ''}`}>
        
        <div className="flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500
            ${isStopped ? 'bg-[#f85149] text-white shadow-lg shadow-[#f85149]/20' : 'bg-[#1ed670] text-black shadow-lg shadow-[#1ed670]/20'}`}>
             {isStopped ? (
               <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                 <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10"/>
               </svg>
             ) : (
               <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                 <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                 <path d="M12 6v6l4 2"/>
               </svg>
             )}
          </div>
          <div className="flex flex-col">
            <span className={`text-[14px] font-black uppercase tracking-tighter ${isStopped ? 'text-[#f85149]' : 'text-[#1ed670]'}`}>
              {isStopped ? 'UNIT_HALTED' : 'DRIVE_ACTIVE'}
            </span>
            <span className="text-[9px] font-bold text-[#484f58] uppercase tracking-[0.2em] mt-1">
              Safety Simulation Node
            </span>
          </div>
        </div>

        {isStopped && (
          <button 
            className="bg-[#1ed670] text-black px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
            onClick={handleReset}
            disabled={loading}
          >
            Manual Reset
          </button>
        )}
      </div>

      {/* Safety Logic Control */}
      <div className="flex items-center justify-between px-2">
         <div className="flex flex-col">
            <span className="text-[12px] font-black text-white uppercase tracking-tight">Logic Interlock</span>
            <span className="text-[9px] text-[#484f58] uppercase font-bold tracking-widest mt-1">Kill-Switch on Breach</span>
         </div>
         
         <button 
          onClick={handleToggle}
          disabled={loading}
          className={`relative w-11 h-6 rounded-full transition-all duration-500 flex items-center px-1 border border-white/5
            ${enabled ? 'bg-[#1ed670] shadow-[0_0_15px_rgba(30,214,112,0.2)]' : 'bg-[#161b22]'}`}
         >
           <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-500
             ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
         </button>
      </div>

      {/* Emergency Overlay (Striking Feedback) */}
      {isStopped && (
        <div className="fixed inset-0 pointer-events-none z-[100] animate-pulse">
           <div className="absolute inset-0 border-[30px] border-[#f85149]/5" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03]">
              <div className="text-[180px] font-black text-[#f85149] uppercase rotate-[-12deg] whitespace-nowrap">
                 EMERGENCY STOP
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
