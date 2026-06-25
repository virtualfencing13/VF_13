import { useState } from 'react';
import { updateSettings, setCamera, changePassword } from '../services/api';

export default function SetupWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    cameraSource: '0',
    recipientEmail: '',
    password: ''
  });

  const handleNext = async () => {
    if (step === 3) {
      setLoading(true);
      try {
        await updateSettings({ recipientEmail: config.recipientEmail });
        await setCamera(config.cameraSource);
        if (config.password) await changePassword(config.password);
        onComplete();
      } catch (err) {
        alert('Setup Failed: ' + err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-8 backdrop-blur-3xl bg-black/80">
      <div className="bg-[#0d1117] border border-[#1ed670]/20 rounded-[32px] w-full max-w-xl overflow-hidden shadow-[0_0_100px_rgba(30,214,112,0.1)]">
        
        {/* Progress Bar */}
        <div className="flex h-1.5 w-full bg-white/5">
          <div 
            className="h-full bg-[#1ed670] transition-all duration-700" 
            style={{ width: `${(step / 3) * 100}%` }} 
          />
        </div>

        <div className="p-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[#1ed670]/10 rounded-2xl flex items-center justify-center text-[#1ed670] mb-8">
            {step === 1 && <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
            {step === 2 && <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
            {step === 3 && <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
          </div>

          <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-3">
            {step === 1 && 'Primary Vision Source'}
            {step === 2 && 'Security Dispatch'}
            {step === 3 && 'Access Interlock'}
          </h1>
          <p className="text-[13px] text-[#8b949e] font-medium leading-relaxed mb-10 max-w-sm">
            {step === 1 && 'Configure your AI video stream. Use 0 for your integrated webcam or an RTSP URL for industrial CCTV.'}
            {step === 2 && 'Enter the authorized email address for high-priority forensic snapshot delivery.'}
            {step === 3 && 'Rotate the default security credentials to ensure the terminal remains secured against unauthorized access.'}
          </p>

          <div className="w-full mb-10">
            {step === 1 && (
              <input 
                type="text"
                value={config.cameraSource}
                onChange={e => setConfig({...config, cameraSource: e.target.value})}
                className="input-setup"
                placeholder="e.g. 0 or rtsp://..."
                autoFocus
              />
            )}
            {step === 2 && (
              <input 
                type="email"
                value={config.recipientEmail}
                onChange={e => setConfig({...config, recipientEmail: e.target.value})}
                className="input-setup"
                placeholder="operator@oasis-core.com"
                autoFocus
              />
            )}
            {step === 3 && (
              <input 
                type="password"
                value={config.password}
                onChange={e => setConfig({...config, password: e.target.value})}
                className="input-setup"
                placeholder="New Terminal Password"
                autoFocus
              />
            )}
          </div>

          <button 
            onClick={handleNext}
            disabled={loading}
            className="w-full h-14 bg-[#1ed670] hover:bg-[#18b35d] text-black rounded-2xl font-black text-[13px] uppercase tracking-widest transition-all shadow-xl shadow-[#1ed670]/20 disabled:opacity-50"
          >
            {loading ? 'SYNCHRONIZING...' : step === 3 ? 'COMPLETE SETUP' : 'NEXT PROTOCOL'}
          </button>
        </div>
      </div>
    </div>
  );
}
