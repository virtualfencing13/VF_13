import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    company: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Keys do not match');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: formData.email,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        company: formData.company
      });
      toast.success('Credentials Registered: Access Protocol Pending');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Registration Protocol Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] flex items-center justify-center p-4 md:p-8 font-['Inter'] relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-[var(--em)]/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(var(--em) 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
      </div>

      <div className="w-full max-w-[600px] z-10 animate-fadein">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-[var(--em)] to-[#2eff88] rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase font-[var(--font-display)]">Operator <span className="text-[var(--em)]">Enrollment</span></h1>
          <p className="text-[10px] font-black text-[var(--em)] tracking-[0.4em] uppercase mt-2 opacity-60">Provision New Node Access</p>
        </div>

        <div className="glass-card p-8 md:p-10 border border-white/5 shadow-3xl backdrop-blur-2xl relative">
          <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-[var(--em)]/30 to-transparent" />
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Full Name</label>
                <input 
                  type="text"
                  className="w-full h-14 px-4 rounded-2xl bg-white/[0.03] border border-white/5 text-white focus:border-[var(--em)]/50 focus:bg-white/[0.05] outline-none transition-all font-medium text-sm"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Company</label>
                <input 
                  type="text"
                  className="w-full h-14 px-4 rounded-2xl bg-white/[0.03] border border-white/5 text-white focus:border-[var(--em)]/50 focus:bg-white/[0.05] outline-none transition-all font-medium text-sm"
                  placeholder="Tesla Giga"
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  type="email"
                  className="w-full h-14 px-4 rounded-2xl bg-white/[0.03] border border-white/5 text-white focus:border-[var(--em)]/50 focus:bg-white/[0.05] outline-none transition-all font-medium text-sm"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Phone Number</label>
                <input 
                  type="tel"
                  className="w-full h-14 px-4 rounded-2xl bg-white/[0.03] border border-white/5 text-white focus:border-[var(--em)]/50 focus:bg-white/[0.05] outline-none transition-all font-medium text-sm"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Access Key</label>
                <input 
                  type="password"
                  className="w-full h-14 px-4 rounded-2xl bg-white/[0.03] border border-white/5 text-white focus:border-[var(--em)]/50 focus:bg-white/[0.05] outline-none transition-all font-medium text-sm"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Confirm Key</label>
                <input 
                  type="password"
                  className="w-full h-14 px-4 rounded-2xl bg-white/[0.03] border border-white/5 text-white focus:border-[var(--em)]/50 focus:bg-white/[0.05] outline-none transition-all font-medium text-sm"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-[var(--em)] to-[#2eff88] text-black font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 text-xs mt-4"
            >
              {loading ? 'Processing Enrollment...' : 'Enroll Operator'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-[11px] font-bold text-muted uppercase tracking-widest">
              Existing Operator? <Link to="/login" className="text-[var(--em)] hover:underline ml-2">Authenticate Here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
