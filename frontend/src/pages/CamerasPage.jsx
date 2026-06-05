import { useState, useEffect } from 'react';
import { 
  getCameras, 
  addCamera, 
  updateCamera, 
  deleteCamera, 
  startCameraStream, 
  stopCameraStream 
} from '../services/api';
import toast from 'react-hot-toast';

export default function CamerasPage({ cameras = [], setCameras }) {
  const [loading, setLoading] = useState(cameras.length === 0);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const defaultCam = {
    id: '',
    node_name: '',
    camera_type: 'webcam',
    rtsp_url: '',
    username: '',
    password: '',
    location: '',
    zone_type: 'danger',
    ai_enabled: true,
    ip_address: ''
  };

  const [newCam, setNewCam] = useState(defaultCam);

  useEffect(() => {
    if (cameras.length === 0) {
      fetchCameras();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCameras = async () => {
    try {
      const data = await getCameras();
      setCameras(data || []);
    } catch (err) {
      toast.error('Surveillance Fleet Sync Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateCamera(newCam.id, newCam);
        toast.success(`Camera data saved: Node "${newCam.node_name}" updated successfully`);
      } else {
        await addCamera(newCam);
        toast.success(`Camera data saved: Node "${newCam.node_name}" provisioned successfully`);
      }
      setShowModal(false);
      setNewCam(defaultCam);
      setIsEditing(false);
      fetchCameras();
    } catch (err) {
      toast.error(err.message || (isEditing ? 'Update failed' : 'Provisioning failed'));
    }
  };

  const openEditModal = (cam) => {
    setNewCam({
      id: cam.id,
      node_name: cam.node_name || cam.name || '',
      camera_type: cam.camera_type || 'webcam',
      rtsp_url: cam.rtsp_url || cam.source || '',
      username: cam.username || '',
      password: cam.password || '',
      location: cam.location || '',
      zone_type: cam.zone_type || 'danger',
      ai_enabled: cam.ai_enabled !== undefined ? cam.ai_enabled : true,
      ip_address: cam.ip_address || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Decommission and purge node "${name}"?`)) return;
    try {
      await deleteCamera(id);
      toast.success(`Node "${name}" decommissioned`);
      fetchCameras();
    } catch (err) {
      toast.error('Decommission failed');
    }
  };

  const handleToggleStream = async (cam) => {
    const action = cam.status === 'online' ? stopCameraStream : startCameraStream;
    const actionStr = cam.status === 'online' ? 'stopping' : 'starting';
    try {
      toast.loading(`Vision stream ${actionStr}...`, { id: 'stream-toggle' });
      await action(cam.id);
      toast.success(`Vision stream updated`, { id: 'stream-toggle' });
      fetchCameras();
    } catch (err) {
      toast.error('Failed to change stream worker state', { id: 'stream-toggle' });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#05070a]">
        <div className="w-12 h-12 border-4 border-[var(--em)] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(16,185,129,0.2)]" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto flex flex-col gap-10 animate-fadein font-['Inter']">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">Camera Fleet</h1>
          <p className="text-[11px] font-bold text-[var(--em)] uppercase tracking-[0.3em] mt-2 opacity-60">Asset Management & Provisioning Protocol</p>
        </div>
        <button 
          onClick={() => { setIsEditing(false); setNewCam(defaultCam); setShowModal(true); }}
          className="h-14 px-8 bg-[var(--em)] text-black rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(16,185,129,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 4v16m8-8H4" /></svg>
          Provision New Node
        </button>
      </div>

      {/* Camera Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cameras.map(cam => (
          <div key={cam.id} className="glass-card group overflow-hidden flex flex-col transition-all duration-500 hover:border-[var(--em)]/30 border border-white/5 bg-white/[0.02]">
            {/* Camera Preview Placeholder */}
            <div className="aspect-video bg-[#05070a] relative overflow-hidden flex items-center justify-center border-b border-white/5">
               <div className="absolute inset-0 opacity-20 bg-[radial-gradient(var(--em)_0.5px,transparent_0.5px)] bg-[length:15px_15px]" />
               
               {/* Live Stream MJPEG Feed if active */}
               {cam.status === 'online' ? (
                 <img
                   src={`/api/cameras/${cam.id}/stream`}
                   alt={cam.node_name}
                   className="w-full h-full object-cover"
                   onError={(e) => { e.target.style.display = 'none'; }}
                 />
               ) : (
                 <svg className="text-white/5 w-20 h-20" fill="none" stroke="currentColor" strokeWidth="1"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
               )}
               
               <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] font-black text-white border border-white/10 uppercase tracking-widest font-mono">
                 {cam.id}
               </div>
               
               <div className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-[0.2em] font-mono transition-all duration-500
                 ${cam.status === 'online' ? 'bg-[var(--em)]/10 border-[var(--em)]/30 text-[var(--em)]' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${cam.status === 'online' ? 'bg-[var(--em)] animate-pulse shadow-[0_0_10px_var(--em)]' : 'bg-red-500'}`} />
                 {cam.status === 'online' ? 'ONLINE' : 'OFFLINE'}
               </div>

               {/* Stats Overlay on Hover */}
               <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-8 gap-4">
                  <div className="grid grid-cols-2 w-full gap-4">
                     <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-[var(--em)] uppercase tracking-widest mb-1">FPS</span>
                        <span className="text-xl font-black text-white">{cam.fps || '0.0'}</span>
                     </div>
                     <div className="flex flex-col items-center">
                        <span className="text-[9px] font-black text-[var(--em)] uppercase tracking-widest mb-1">LATENCY</span>
                        <span className="text-xl font-black text-white">{cam.latency ? `${cam.latency}ms` : '0ms'}</span>
                     </div>
                  </div>
                  <button 
                    onClick={() => handleToggleStream(cam)}
                    className={`w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all
                      ${cam.status === 'online' ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.2)]' : 'bg-[var(--em)] text-black'}`}
                  >
                    {cam.status === 'online' ? 'STOP STREAM' : 'START STREAM'}
                  </button>
               </div>
            </div>
            
            <div className="p-8 flex flex-col gap-6">
               <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">{cam.node_name || cam.name || 'Unnamed Node'}</h3>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-2">TYPE: {(cam.camera_type || 'webcam').toUpperCase()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEditModal(cam)}
                      className="p-3 bg-white/5 hover:bg-blue-500/10 hover:text-blue-500 text-muted rounded-xl transition-all"
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button 
                      onClick={() => handleDelete(cam.id, cam.node_name || cam.name || 'Unnamed Node')}
                      className="p-3 bg-white/5 hover:bg-red-500/10 hover:text-red-500 text-muted rounded-xl transition-all"
                    >
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl group/stat">
                    <span className="text-[9px] font-black text-muted uppercase tracking-widest block mb-2 font-mono group-hover/stat:text-[var(--em)] transition-colors">IP / RTSP LINK</span>
                    <span className="text-[11px] font-black text-white font-mono truncate block opacity-60">{cam.rtsp_url || cam.source || 'Local Node'}</span>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl group/stat">
                    <span className="text-[9px] font-black text-muted uppercase tracking-widest block mb-2 font-mono group-hover/stat:text-[var(--em)] transition-colors">ZONE & AI</span>
                    <span className="text-[11px] font-black text-white font-mono opacity-60">
                      {(cam.zone_type || 'danger').toUpperCase()} / {cam.ai_enabled ? 'AI ON' : 'AI OFF'}
                    </span>
                  </div>
               </div>
            </div>
          </div>
        ))}

        {/* Add New Node Placeholder Card */}
        <button 
          onClick={() => { setIsEditing(false); setNewCam(defaultCam); setShowModal(true); }}
          className="glass-card flex flex-col items-center justify-center gap-6 p-10 min-h-[400px] group border-dashed border-white/10 hover:border-[var(--em)]/50 transition-all duration-500 hover:bg-[var(--em)]/[0.02]"
        >
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-[var(--em)]/30 group-hover:bg-[var(--em)]/10 transition-all duration-500">
             <svg className="text-white/20 group-hover:text-[var(--em)] transition-colors" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
          </div>
          <div className="text-center">
             <span className="text-xs font-black text-white uppercase tracking-widest block">Provision New Node</span>
             <span className="text-[9px] font-bold text-muted uppercase tracking-[0.2em] mt-2 block">Link camera asset to network</span>
          </div>
        </button>
      </div>

      {/* Provisioning Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-fadein">
          <div className="glass-card w-full max-w-xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 relative">
             <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--em)] to-transparent" />
             
             <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                   <h2 className="text-xl font-black text-white uppercase tracking-tight">{isEditing ? 'Edit Node Configuration' : 'Provisioning Terminal'}</h2>
                   <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">{isEditing ? 'Update Settings & IP Stream' : 'Configure New Security Node'}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted hover:text-white transition-all">
                   <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>
             
             <form onSubmit={handleRegister} className="p-10 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                
                {/* Node Name */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Node Display Name</label>
                  <input 
                    type="text" required
                    className="w-full h-14 px-6 rounded-2xl bg-white/[0.03] border border-white/10 text-white focus:border-[var(--em)]/50 focus:bg-white/[0.05] outline-none transition-all text-sm"
                    placeholder="South Gate Perimeter"
                    value={newCam.node_name}
                    onChange={e => setNewCam({...newCam, node_name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Camera Type */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Camera Type</label>
                    <select
                      className="w-full h-14 px-6 rounded-2xl bg-[#090b10] border border-white/10 text-white focus:border-[var(--em)]/50 outline-none transition-all text-sm"
                      value={newCam.camera_type}
                      onChange={e => setNewCam({...newCam, camera_type: e.target.value})}
                    >
                      <option value="webcam">Webcam</option>
                      <option value="rtsp">RTSP Camera</option>
                      <option value="ip">IP Camera</option>
                      <option value="usb">USB Camera</option>
                    </select>
                  </div>

                  {/* Location Name */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Location / Zone</label>
                    <input 
                      type="text" required
                      className="w-full h-14 px-6 rounded-2xl bg-white/[0.03] border border-white/10 text-white focus:border-[var(--em)]/50 focus:bg-white/[0.05] outline-none transition-all text-sm"
                      placeholder="Warehouse A"
                      value={newCam.location}
                      onChange={e => setNewCam({...newCam, location: e.target.value})}
                    />
                  </div>
                </div>

                {/* Camera Source / RTSP URL / IP */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">
                    {newCam.camera_type === 'webcam' ? 'Webcam Index (e.g. 0, 1)' : 'RTSP URL / IP Address'}
                  </label>
                  <input 
                    type="text" required
                    className="w-full h-14 px-6 rounded-2xl bg-white/[0.03] border border-white/10 text-white font-mono focus:border-[var(--em)]/50 focus:bg-white/[0.05] outline-none transition-all text-sm"
                    placeholder={newCam.camera_type === 'webcam' ? '0' : 'rtsp://admin:secret@192.168.1.64:554/stream'}
                    value={newCam.rtsp_url}
                    onChange={e => setNewCam({...newCam, rtsp_url: e.target.value})}
                  />
                </div>

                {/* ESP32 Controller IP Address */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">
                    ESP32 Controller IP (Optional - for wireless safety switch)
                  </label>
                  <input 
                    type="text"
                    className="w-full h-14 px-6 rounded-2xl bg-white/[0.03] border border-white/10 text-white font-mono focus:border-[var(--em)]/50 focus:bg-white/[0.05] outline-none transition-all text-sm"
                    placeholder="192.168.55.101"
                    value={newCam.ip_address || ''}
                    onChange={e => setNewCam({...newCam, ip_address: e.target.value})}
                  />
                </div>

                {/* Credentials (optional) */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Username (Optional)</label>
                    <input 
                      type="text"
                      className="w-full h-14 px-6 rounded-2xl bg-white/[0.03] border border-white/10 text-white focus:border-[var(--em)]/50 outline-none transition-all text-sm"
                      placeholder="admin"
                      value={newCam.username}
                      onChange={e => setNewCam({...newCam, username: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Password (Optional)</label>
                    <input 
                      type="password"
                      className="w-full h-14 px-6 rounded-2xl bg-white/[0.03] border border-white/10 text-white focus:border-[var(--em)]/50 outline-none transition-all text-sm"
                      placeholder="••••••••"
                      value={newCam.password}
                      onChange={e => setNewCam({...newCam, password: e.target.value})}
                    />
                  </div>
                </div>

                {/* Additional Settings */}
                <div className="grid grid-cols-2 gap-6 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                  {/* Zone Type */}
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest mb-2 ml-1">Zone Type</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNewCam({...newCam, zone_type: 'danger'})}
                        className={`flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border
                          ${newCam.zone_type === 'danger' ? 'bg-red-500/20 text-red-500 border-red-500/40' : 'bg-transparent border-white/10 text-muted'}`}
                      >
                        Danger
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCam({...newCam, zone_type: 'warning'})}
                        className={`flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border
                          ${newCam.zone_type === 'warning' ? 'bg-amber-500/20 text-amber-500 border-amber-500/40' : 'bg-transparent border-white/10 text-muted'}`}
                      >
                        Warning
                      </button>
                    </div>
                  </div>

                  {/* AI Detection Toggle */}
                  <div className="flex flex-col justify-center items-end pr-2">
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest mb-2 mr-1">AI Inference</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">
                        {newCam.ai_enabled ? 'Active' : 'Disabled'}
                      </span>
                      <div 
                        className={`toggle-switch ${newCam.ai_enabled ? 'toggle-switch-on' : ''}`}
                        onClick={() => setNewCam({...newCam, ai_enabled: !newCam.ai_enabled})}
                      >
                        <div className="toggle-thumb" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <button type="submit" className="w-full h-16 bg-[var(--em)] text-black rounded-2xl mt-4 text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(16,185,129,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all">
                   {isEditing ? 'UPDATE ASSET CONFIGURATION' : 'INITIALIZE ASSET PROVISIONING'}
                </button>
             </form>
          </div>
        </div>
      )}

    </div>
  );
}
