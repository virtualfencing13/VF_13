import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      toast.success('Recovery Protocol Dispatched');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#05070a] flex items-center justify-center p-4 md:p-8 font-['Inter'] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-[var(--em)]/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(var(--em) 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
      </div>

      <div className="w-full max-w-[480px] z-10 animate-fadein">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-[var(--em)] to-[#2eff88] rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase font-[var(--font-display)]">Key <span className="text-[var(--em)]">Recovery</span></h1>
          <p className="text-[10px] font-black text-[var(--em)] tracking-[0.4em] uppercase mt-2 opacity-60">Reset Security Credentials</p>
        </div>

        <div className="glass-card p-8 md:p-10 border border-white/5 shadow-3xl backdrop-blur-2xl relative">
          <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-[var(--em)]/30 to-transparent" />
          
          {sent ? (
            <div className="text-center py-6 animate-fadein">
              <div className="w-20 h-20 bg-[var(--em)]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[var(--em)]/20">
                <svg className="text-[var(--em)]" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">Instructions Dispatched</h2>
              <p className="text-[11px] font-medium text-muted uppercase tracking-[0.1em] leading-relaxed">
                We have transmitted recovery instructions to your registered email address. 
                Please check your inbox to continue the reset protocol.
              </p>
              <Link to="/login" className="btn-em w-full h-14 rounded-2xl flex items-center justify-center text-xs font-black uppercase tracking-[0.3em] mt-10">Return to Login</Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Recover Access</h2>
                <p className="text-[11px] font-bold text-muted uppercase tracking-widest mt-1">Provide your registered operator email</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Operator Email</label>
                  <input 
                    type="email"
                    className="w-full h-14 px-4 rounded-2xl bg-white/[0.03] border border-white/5 text-white focus:border-[var(--em)]/50 focus:bg-white/[0.05] outline-none transition-all font-medium text-sm"
                    placeholder="operator@facility.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-[var(--em)] to-[#2eff88] text-black font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 text-xs mt-2"
                >
                  {loading ? 'Transmitting...' : 'Dispatch Reset Protocol'}
                </button>
              </form>
            </>
          )}

          {!sent && (
            <div className="mt-10 pt-8 border-t border-white/5 text-center">
              <Link to="/login" className="text-[11px] font-black text-muted hover:text-[var(--em)] uppercase tracking-widest transition-colors">Return to Authentication Terminal</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
