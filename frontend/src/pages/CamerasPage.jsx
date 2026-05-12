import { useState, useEffect } from 'react';
import { getCameras, addCamera, deleteCamera, setCamera } from '../services/api';
import toast from 'react-hot-toast';

export default function CamerasPage() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sourceType, setSourceType] = useState('webcam'); // 'webcam' or 'ip'
  const [newCam, setNewCam] = useState({ id: '', name: '', source: '0', resolution: '1080p', model: 'Industrial-V2' });

  useEffect(() => {
    fetchCameras();
  }, []);

  const fetchCameras = async () => {
    try {
      const data = await getCameras();
      setCameras(data.cameras || []);
    } catch (err) {
      toast.error('Failed to sync camera registry');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await addCamera(newCam);
      toast.success(`Node ${newCam.id} registered successfully`);
      setShowModal(false);
      setNewCam({ id: '', name: '', source: '0', resolution: '1080p', model: 'Industrial-V2' });
      fetchCameras();
    } catch (err) {
      toast.error('Registration failed: ID must be unique');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Decommission node ${id}?`)) return;
    try {
      await deleteCamera(id);
      toast.success(`Node ${id} decommissioned`);
      fetchCameras();
    } catch (err) {
      toast.error('Decommission failed');
    }
  };

  const handleSwitch = async (id) => {
    try {
      await setCamera(id);
      toast.success(`Switching to Node ${id}...`);
      fetchCameras();
    } catch (err) {
      toast.error('Switch failed');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--green)] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(0,255,65,0.2)]" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-8 animate-fadein font-['Rajdhani']">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter font-[var(--font-display)]">Camera Registry</h1>
          <p className="text-[12px] font-bold text-[var(--green)] uppercase tracking-[0.4em] mt-2 opacity-80 font-[var(--font-mono)]">Global Asset Management & Provisioning</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary h-12 px-8 rounded-2xl flex items-center gap-3 text-[11px] font-black uppercase tracking-widest shadow-[0_0_30px_rgba(0,255,65,0.3)]"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 4v16m8-8H4" /></svg>
          Register New Node
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cameras.map(cam => (
          <div key={cam.id} className="industrial-card group overflow-hidden flex flex-col transition-all hover:scale-[1.02] hover:border-[var(--green)]/30">
            <div className="aspect-video bg-black/50 relative overflow-hidden flex items-center justify-center border-b border-white/5">
               <svg className="text-white/5 w-24 h-24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
               <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-black text-white border border-white/10 uppercase font-[var(--font-mono)]">{cam.id}</div>
               <div className={`absolute top-4 right-4 flex items-center gap-2 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest font-[var(--font-mono)]
                 ${cam.status === 'active' ? 'bg-[var(--green)]/10 border-[var(--green)]/30 text-[var(--green)]' : 'bg-white/5 border-white/10 text-[#484f58]'}`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${cam.status === 'active' ? 'bg-[var(--green)] animate-pulse' : 'bg-[#484f58]'}`} />
                 {cam.status}
               </div>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
               <div>
                  <h3 className="text-white font-black uppercase text-lg leading-tight font-[var(--font-display)]">{cam.name}</h3>
                  <p className="text-[10px] text-[#484f58] font-bold uppercase tracking-[0.2em] mt-1 font-[var(--font-mono)]">Model: {cam.model}</p>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/2 border border-white/5 p-3 rounded-xl">
                    <span className="text-[9px] font-bold text-[#484f58] uppercase block mb-1 font-[var(--font-mono)]">IP / SOURCE</span>
                    <span className="text-[11px] font-black text-[#8b949e] font-[var(--font-mono)] truncate block">{cam.source}</span>
                  </div>
                  <div className="bg-white/2 border border-white/5 p-3 rounded-xl">
                    <span className="text-[9px] font-bold text-[#484f58] uppercase block mb-1 font-[var(--font-mono)]">RESOLUTION</span>
                    <span className="text-[11px] font-black text-[#8b949e] font-[var(--font-mono)]">{cam.resolution}</span>
                  </div>
               </div>
            </div>
            
            <div className="mt-auto px-6 py-4 border-t border-white/5 flex gap-2">
               <button 
                onClick={() => handleSwitch(cam.id)}
                className={`flex-1 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all font-[var(--font-mono)]
                  ${cam.status === 'active' ? 'bg-[var(--green)] text-black' : 'bg-white/5 hover:bg-white/10 text-white'}`}
               >
                 {cam.status === 'active' ? 'ACTIVE' : 'ACTIVATE'}
               </button>
               <button 
                onClick={() => handleDelete(cam.id)}
                className="h-10 w-10 rounded-lg bg-white/5 hover:bg-[var(--color-red)]/10 hover:text-[var(--color-red)] text-[#484f58] flex items-center justify-center transition-all"
               >
                 <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadein">
          <div className="industrial-card w-full max-w-md overflow-hidden shadow-2xl">
             <div className="px-8 py-6 border-b border-white/5 bg-white/2 flex items-center justify-between">
                <span className="text-sm font-black text-white uppercase tracking-widest font-[var(--font-display)]">Initialize Node</span>
                <button onClick={() => setShowModal(false)} className="text-[#484f58] hover:text-white transition-colors">
                   <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
             
             <form onSubmit={handleRegister} className="p-8 flex flex-col gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-[#484f58] uppercase tracking-widest font-[var(--font-mono)]">Node Name</label>
                   <input 
                    type="text" 
                    required
                    className="input w-full bg-black/40 border-white/10 text-white"
                    placeholder="e.g. Loading Dock 04"
                    value={newCam.name}
                    onChange={e => setNewCam({...newCam, name: e.target.value, id: e.target.value.toLowerCase().replace(/ /g, '_')})}
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-[#484f58] uppercase tracking-widest font-[var(--font-mono)]">Source Type</label>
                   <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                      <button 
                        type="button"
                        onClick={() => { setSourceType('webcam'); setNewCam({...newCam, source: '0'}); }}
                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                          ${sourceType === 'webcam' ? 'bg-[var(--green)] text-black' : 'text-[#484f58]'}`}
                      >
                        Webcam
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setSourceType('ip'); setNewCam({...newCam, source: ''}); }}
                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                          ${sourceType === 'ip' ? 'bg-[var(--green)] text-black' : 'text-[#484f58]'}`}
                      >
                        IP URL
                      </button>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-[#484f58] uppercase tracking-widest font-[var(--font-mono)]">
                     {sourceType === 'webcam' ? 'Camera Index' : 'Stream URL'}
                   </label>
                   <input 
                    type="text" 
                    required
                    className="input w-full bg-black/40 border-white/10 text-white font-[var(--font-mono)]"
                    placeholder={sourceType === 'webcam' ? '0, 1, 2...' : 'rtsp://... or http://...'}
                    value={newCam.source}
                    onChange={e => setNewCam({...newCam, source: e.target.value})}
                   />
                </div>
                
                <div className="flex gap-4 mt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-12 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#8b949e] hover:bg-white/5 transition-all">
                    Abort
                  </button>
                  <button type="submit" className="flex-1 h-12 rounded-xl bg-[var(--green)] text-black text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,65,0.2)] hover:scale-[1.02] transition-all">
                    Establish Link
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}

    </div>
  );
}
