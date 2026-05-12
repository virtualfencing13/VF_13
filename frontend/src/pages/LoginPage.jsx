import { useState, useEffect } from 'react';
import { login, register } from '../services/api';

export default function LoginPage({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    role: 'Operator',
    password: '',
    confirmPassword: '',
    rememberMe: false
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Weak', color: 'bg-red-500' });

  // Simple Email & Phone Validation patterns
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const phoneValid = formData.phone.length > 0 ? /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(formData.phone) : true;

  // Password Strength Logic
  useEffect(() => {
    const pw = formData.password;
    let score = 0;
    if (pw.length > 5) score += 1;
    if (pw.length > 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    if (score <= 2) setPasswordStrength({ score, label: 'Weak', color: 'bg-red-500' });
    else if (score === 3 || score === 4) setPasswordStrength({ score, label: 'Medium', color: 'bg-amber-500' });
    else setPasswordStrength({ score, label: 'Strong', color: 'bg-[#1ed670]' });
  }, [formData.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isSignup) {
      if (!emailValid) {
        setError('Invalid Email Address');
        setLoading(false);
        return;
      }
      if (formData.phone.length > 0 && !phoneValid) {
        setError('Invalid Mobile Number format');
        setLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
    }

    try {
      if (isSignup) {
        await register({
          username: formData.email,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phone: formData.phone,
          company: formData.company,
          role: formData.role
        });
        setIsSignup(false);
        setError('Account created successfully! Please login.');
      } else {
        await login(formData.email, formData.password);
        if (formData.rememberMe) {
          localStorage.setItem('fence_remember', formData.email);
        }
        sessionStorage.setItem('operator_email', formData.email);
        onLogin(formData.email);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 md:p-8 font-['Rajdhani'] relative overflow-hidden">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 65, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 65, 0.1) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      
      <div className="w-full max-w-[1000px] h-[85vh] min-h-[650px] bg-[#0d1117]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl flex overflow-hidden z-10">
        
        {/* ── Left Branding Panel ────────────────────────────────────────── */}
        <div className="hidden md:flex flex-col w-2/5 bg-gradient-to-br from-[#060a0a] to-[#0d1117] p-12 text-white relative overflow-hidden shrink-0 border-r border-white/10">
          {/* Neon Glows */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[var(--green)]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[var(--color-red)]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-16 group cursor-default">
              <div className="w-12 h-12 bg-[var(--green)] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,255,65,0.4)] transform transition-transform group-hover:rotate-12">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tighter leading-none font-[var(--font-display)]">Virtual <span className="text-[var(--green)]">Fence</span></span>
                <span className="text-[10px] font-bold text-[var(--green)] tracking-[0.3em] uppercase font-[var(--font-mono)]">Monitoring System</span>
              </div>
            </div>

            <div className="space-y-8">
              <h1 className="text-4xl font-black tracking-tight leading-[1.1] font-[var(--font-display)] uppercase">
                Secure <span className="text-[var(--green)]">Virtual</span> <br/>Fencing
              </h1>
              <p className="text-[#8b949e] font-medium leading-relaxed font-['Rajdhani'] text-lg">
                Secure your industrial perimeter with enterprise-grade computer vision. 
                Real-time detection and automated safety alerts.
              </p>
              
              <div className="flex flex-col gap-4 mt-12">
                {[
                  { label: 'Neural Precision', val: '99.8%' },
                  { label: 'Latency Node', val: '14ms' },
                  { label: 'Global Secure', val: 'Active' },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[11px] uppercase font-bold text-[#484f58] tracking-widest font-[var(--font-mono)]">{stat.label}</span>
                    <span className="text-[11px] uppercase font-black text-[var(--green)] font-[var(--font-mono)]">{stat.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto">
              <button 
                onClick={() => setIsSignup(!isSignup)}
                className="group flex items-center gap-3 text-sm font-black uppercase tracking-widest text-white hover:text-[var(--green)] transition-all font-[var(--font-mono)]"
              >
                {isSignup ? 'Already have an account?' : 'Create a New Account'}
                <svg className="transform transition-transform group-hover:translate-x-1" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Auth Form Panel ──────────────────────────────────────── */}
        <div className="w-full md:w-3/5 p-8 md:p-12 flex flex-col overflow-y-auto custom-scrollbar relative">
          
          <div className="flex flex-col mb-8">
            <h2 className="text-4xl font-black text-[#0f172a] tracking-tight">
              {isSignup ? 'Create Account' : 'Log in'}
            </h2>
            <p className="text-sm text-[#64748b] mt-2 font-medium">
              {isSignup 
                ? 'Register your details to create an account.' 
                : 'Welcome back! Please enter your details.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
            
            {/* Error / Success Alert */}
            {error && (
              <div className={`p-4 rounded-xl text-xs font-bold text-center border animate-shake
                ${error.includes('successfully') ? 'bg-green-900/20 text-[var(--green)] border-[var(--green)]/30' : 'bg-red-900/20 text-[var(--color-red)] border-[var(--color-red)]/30'}`}>
                {error}
              </div>
            )}

            {isSignup && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#484f58] uppercase tracking-widest font-[var(--font-mono)] ml-1">Operator Name</label>
                    <input 
                      type="text"
                      className="w-full h-12 px-4 rounded-xl border border-white/5 bg-black/40 text-white focus:border-[var(--green)]/50 focus:ring-4 focus:ring-[var(--green)]/5 outline-none transition-all font-medium"
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                      required
                      placeholder="J. Miller"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#484f58] uppercase tracking-widest font-[var(--font-mono)] ml-1">Phone Number</label>
                    <input 
                      type="tel"
                      className={`w-full h-12 px-4 rounded-xl border bg-black/40 text-white focus:border-[var(--green)]/50 focus:ring-4 focus:ring-[var(--green)]/5 outline-none transition-all font-medium
                        ${formData.phone.length > 0 && !phoneValid ? 'border-[var(--color-red)]' : 'border-white/5'}`}
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="+1..."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#484f58] uppercase tracking-widest font-[var(--font-mono)] ml-1">Company / Facility</label>
                    <input 
                      type="text"
                      className="w-full h-12 px-4 rounded-xl border border-white/5 bg-black/40 text-white focus:border-[var(--green)]/50 focus:ring-4 focus:ring-[var(--green)]/5 outline-none transition-all font-medium"
                      value={formData.company}
                      onChange={e => setFormData({...formData, company: e.target.value})}
                      placeholder="Oasis Ind."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[#484f58] uppercase tracking-widest font-[var(--font-mono)] ml-1">Authorization Rank</label>
                    <select 
                      className="w-full h-12 px-4 rounded-xl border border-white/5 bg-black/40 text-white focus:border-[var(--green)]/50 outline-none transition-all font-medium font-[var(--font-mono)]"
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="Operator">Level 1: Operator</option>
                      <option value="Security">Level 2: Security</option>
                      <option value="Admin">Level 3: Admin</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#484f58] uppercase tracking-widest font-[var(--font-mono)] ml-1">Email Address</label>
              <input 
                type="email" 
                className={`w-full h-12 px-4 rounded-xl border bg-black/40 text-white focus:border-[var(--green)]/50 focus:ring-4 focus:ring-[var(--green)]/5 outline-none transition-all font-medium
                  ${formData.email.length > 0 && !emailValid ? 'border-[var(--color-red)]' : 'border-white/5'}`}
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[#484f58] uppercase tracking-widest font-[var(--font-mono)] ml-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="w-full h-12 px-4 rounded-xl border border-white/5 bg-black/40 text-white focus:border-[var(--green)]/50 focus:ring-4 focus:ring-[var(--green)]/5 outline-none transition-all font-medium pr-12"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#484f58] hover:text-[var(--green)] transition-colors"
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.855-2.43a10 10 0 0110.25 4.459c.227.346.454.731.659 1.139m-9.176 9.176a3 3 0 01-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              
              {isSignup && formData.password.length > 0 && (
                <div className="mt-3 px-1">
                   <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#484f58]">Password Strength</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${passwordStrength.color.replace('bg-', 'text-')}`}>{passwordStrength.label}</span>
                   </div>
                   <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-full flex-1 transition-all duration-500 ${i <= passwordStrength.score ? passwordStrength.color : 'bg-transparent'}`} />
                      ))}
                   </div>
                </div>
              )}
            </div>

            {!isSignup && (
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="peer sr-only"
                      checked={formData.rememberMe}
                      onChange={e => setFormData({...formData, rememberMe: e.target.checked})}
                    />
                    <div className="w-5 h-5 rounded border-2 border-white/10 peer-checked:bg-[var(--green)] peer-checked:border-[var(--green)] transition-all flex items-center justify-center">
                       <svg className="text-black scale-0 peer-checked:scale-100 transition-transform" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="4"><path d="M3 7l2 2 4-4" /></svg>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#8b949e] uppercase tracking-widest group-hover:text-white transition-colors">Remember Me</span>
                </label>
                <button type="button" className="text-[11px] font-bold text-[#8b949e] uppercase tracking-widest hover:text-[var(--green)] transition-colors">Forgot Password?</button>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-[var(--green)] to-[#2eff88] text-black font-black uppercase tracking-[0.3em] rounded-2xl shadow-[0_10px_30px_rgba(0,255,65,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-2 font-[var(--font-display)] text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                isSignup ? 'Sign Up' : 'Log In'
              )}
            </button>
          </form>

          <div className="mt-auto pt-10 text-center md:hidden">
            <button 
              onClick={() => setIsSignup(!isSignup)}
              className="text-[11px] font-black uppercase tracking-widest text-[#8b949e] hover:text-[var(--green)]"
            >
              {isSignup ? 'Log in to existing account' : 'Sign up for new account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
