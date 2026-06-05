import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, googleLogin } from '../services/api';
import toast from 'react-hot-toast';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '485720194857-fakeclient.apps.googleusercontent.com';

export default function LoginPage({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accessState, setAccessState] = useState('idle'); // 'idle' | 'success' | 'denied'
  const googleBtnRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const remembered = localStorage.getItem('fence_remember');
    if (remembered) {
      setFormData(prev => ({ ...prev, email: remembered, rememberMe: true }));
    }
  }, []);

  // Initialize and Render Google Sign-In button using standard Identity Services API
  useEffect(() => {
    if (window.google) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-btn-container'),
          { 
            type: 'standard',
            theme: 'filled_dark', 
            size: 'large', 
            text: 'continue_with',
            shape: 'rectangular',
            width: '380',
            logo_alignment: 'left'
          }
        );
      } catch (err) {
        console.error("Google Identity Services failed to initialize:", err);
      }
    }
  }, []);

  // Handler for Google Token response
  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    setAccessState('idle');
    try {
      const res = await googleLogin(response.credential, GOOGLE_CLIENT_ID);
      
      setAccessState('success');
      toast.success('Google Authentication Verified: Access Node Linked');
      
      // Call App's onLogin with standard parameters
      setTimeout(() => {
        onLogin(
          res.token,
          res.email,
          res.role,
          res.company,
          res.fullName,
          res.picture
        );
        navigate('/dashboard');
      }, 1500);

    } catch (err) {
      setAccessState('denied');
      toast.error(err.message || 'Google SecOps Authorization Rejected');
      setTimeout(() => setAccessState('idle'), 4000);
    } finally {
      setLoading(false);
    }
  };

  // Handler for Standard username/password login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAccessState('idle');

    try {
      const res = await login(formData.email, formData.password);
      if (formData.rememberMe) {
        localStorage.setItem('fence_remember', formData.email);
      } else {
        localStorage.removeItem('fence_remember');
      }

      setAccessState('success');
      toast.success('Access Granted: Secure Session Initiated');
      
      setTimeout(() => {
        onLogin(
          res.token,
          res.email,
          res.role,
          res.company,
          res.fullName,
          null
        );
        navigate('/dashboard');
      }, 1500);

    } catch (err) {
      setAccessState('denied');
      toast.error(err.message || 'Authentication Protocol Rejected');
      setTimeout(() => setAccessState('idle'), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] flex items-center justify-center p-4 md:p-8 font-['Inter'] relative overflow-hidden">
      
      {/* Background cyber grid */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-[var(--em)]/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-[var(--danger)]/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(var(--em) 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
      </div>

      <div className="w-full max-w-[480px] z-10 animate-fadein">
        
        {/* Title */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-[var(--em)] to-[#2eff88] rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] mb-6 transform hover:rotate-12 transition-transform duration-500">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Fence<span className="text-[var(--em)]">AI</span> Control</h1>
          <p className="text-[10px] font-black text-[var(--em)] tracking-[0.4em] uppercase mt-2 opacity-60">Enterprise Security Terminal</p>
        </div>

        {/* Access State Overlay screens */}
        {accessState === 'success' && (
          <div className="glass-card p-10 border-2 border-[var(--em)] shadow-[0_0_50px_rgba(16,185,129,0.4)] backdrop-blur-2xl text-center space-y-6 animate-pulse z-50">
            <div className="w-20 h-20 bg-[var(--em)]/10 rounded-full flex items-center justify-center mx-auto border-2 border-[var(--em)] shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <svg width="40" height="40" fill="none" stroke="var(--em)" strokeWidth="4" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 className="text-2xl font-black tracking-widest text-[var(--em)] uppercase">ACCESS VERIFIED</h2>
            <p className="text-[10px] font-black text-muted tracking-widest uppercase">Operator Linked • Securing Node Session</p>
          </div>
        )}

        {accessState === 'denied' && (
          <div className="glass-card p-10 border-2 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)] backdrop-blur-2xl text-center space-y-6 animate-pulse z-50">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              <svg width="40" height="40" fill="none" stroke="red" strokeWidth="4" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 className="text-2xl font-black tracking-widest text-red-500 uppercase">ACCESS DENIED</h2>
            <p className="text-[10px] font-black text-muted tracking-widest uppercase">Unauthorized operator credentials rejected</p>
          </div>
        )}

        {accessState === 'idle' && (
          <div className="glass-card p-8 md:p-10 border border-white/5 shadow-3xl backdrop-blur-2xl relative">
            <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-[var(--em)]/30 to-transparent" />
            
            <div className="mb-8">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Security Access</h2>
              <p className="text-[11px] font-bold text-muted uppercase tracking-widest mt-1">Initialize identity link to industrial Node</p>
            </div>

            {/* Google Authentication Container */}
            <div className="flex flex-col items-center gap-4 mb-6">
              <div 
                id="google-signin-btn-container" 
                className="w-full flex justify-center hover:scale-[1.01] transition-transform active:scale-[0.99] border border-white/10 p-0.5 rounded-xl bg-black/30 overflow-hidden" 
              />
              <span className="text-[9px] font-black text-muted tracking-[0.25em] uppercase">OR CONNECT WITH SECURE CREDENTIALS</span>
            </div>

            {/* Normal credentials login */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Operator Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center text-muted group-focus-within:text-[var(--em)] transition-colors">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z"/><path d="M22 6l-10 7L2-6"/></svg>
                  </div>
                  <input 
                    type="email"
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/[0.03] border border-white/5 text-white focus:border-[var(--em)]/50 focus:bg-white/[0.05] outline-none transition-all font-medium text-sm"
                    placeholder="operator@facility.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest">Access Key</label>
                  <Link to="/forgot-password" size="sm" className="text-[9px] font-black text-muted hover:text-[var(--em)] uppercase tracking-widest transition-colors">Recover Key</Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center text-muted group-focus-within:text-[var(--em)] transition-colors">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    className="w-full h-14 pl-12 pr-12 rounded-2xl bg-white/[0.03] border border-white/5 text-white focus:border-[var(--em)]/50 focus:bg-white/[0.05] outline-none transition-all font-medium text-sm"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                      {showPassword ? <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /> : <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />}
                      {!showPassword && <circle cx="12" cy="12" r="3" />}
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="hidden"
                    checked={formData.rememberMe}
                    onChange={e => setFormData({ ...formData, rememberMe: e.target.checked })}
                  />
                  <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${formData.rememberMe ? 'bg-[var(--em)] border-[var(--em)]' : 'border-white/10'}`}>
                    {formData.rememberMe && <svg width="12" height="12" fill="none" stroke="black" strokeWidth="4"><path d="M3 7l2 2 4-4"/></svg>}
                  </div>
                  <span className="text-[11px] font-black text-muted uppercase tracking-widest group-hover:text-white transition-colors">Trust this node</span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-[var(--em)] to-[#2eff88] text-black font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 text-xs mt-2"
              >
                {loading ? 'Authorizing link...' : 'Authorize Link'}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-white/5 text-center">
              <p className="text-[11px] font-bold text-muted uppercase tracking-widest">
                New Deployment? <Link to="/register" className="text-[var(--em)] hover:underline ml-2">Request Credentials</Link>
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center gap-8 opacity-40">
           <span className="text-[9px] font-black text-muted uppercase tracking-widest">V3.0.0 SECURE COGNITIVE</span>
           <span className="text-[9px] font-black text-muted uppercase tracking-widest">ENCRYPTED_JWT_ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
