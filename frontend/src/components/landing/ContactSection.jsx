import { useState } from 'react';

export default function ContactSection() {
  const [form, setForm] = useState({ name:'', email:'', company:'', message:'' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
    setForm({ name:'', email:'', company:'', message:'' });
  };

  return (
    <section id="contact" className="section-pad" style={{background:'var(--graphite)'}}>
      <div className="section-inner">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <div className="reveal">
            <div className="section-label">Contact</div>
            <h2 className="section-heading">Ready to Secure<br/><span className="text-gradient">Your Facility?</span></h2>
            <p className="section-sub mb-10">Contact our enterprise team to schedule a demo, discuss deployment, or get a custom safety assessment for your facility.</p>

            <div className="flex flex-col gap-6">
              {[
                {icon:'📧', l:'Email', v:'team@aivirtualfence.com'},
                {icon:'📞', l:'Phone', v:'+91 98765 43210'},
                {icon:'🏢', l:'Office', v:'Chennai, Tamil Nadu, India'},
              ].map(({icon,l,v}) => (
                <div key={l} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{background:'var(--em-glow)',border:'1px solid var(--border-em)'}}>
                    {icon}
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-widest font-semibold mb-0.5" style={{color:'var(--text-muted)'}}>{l}</div>
                    <div className="text-[14px] font-semibold text-white">{v}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="reveal reveal-delay-2">
            <div className="p-card p-8" style={{borderColor:'var(--border-em)'}}>
              {sent ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background:'var(--em-glow)',border:'1px solid var(--border-em)'}}>
                    <svg width="28" height="28" fill="none" stroke="var(--em)" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <div className="text-xl font-black text-white mb-2">Message Sent</div>
                  <div className="text-[14px]" style={{color:'var(--text-sec)'}}>We'll get back to you within 24 hours.</div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="text-[16px] font-black text-white mb-2">Send a Message</div>
                  {[
                    {id:'name',label:'Full Name',type:'text',placeholder:'Your full name'},
                    {id:'email',label:'Email Address',type:'email',placeholder:'you@company.com'},
                    {id:'company',label:'Company / Institution',type:'text',placeholder:'Company or university name'},
                  ].map(({id,label,type,placeholder}) => (
                    <div key={id}>
                      <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{color:'var(--text-muted)'}}>{label}</label>
                      <input id={id} type={type} required placeholder={placeholder}
                        value={form[id]} onChange={e => setForm({...form,[id]:e.target.value})}
                        className="contact-input" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{color:'var(--text-muted)'}}>Message</label>
                    <textarea id="message" required placeholder="Describe your facility and safety requirements..." rows={4}
                      value={form.message} onChange={e => setForm({...form, message:e.target.value})}
                      className="contact-input resize-none"/>
                  </div>
                  <button type="submit" className="btn-em w-full justify-center mt-2">
                    Send Message
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5-5-5-5"/></svg>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
