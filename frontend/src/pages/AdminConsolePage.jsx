import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  getAdminUsers, 
  adminApproveUser, 
  adminUpdateUserRole, 
  adminDeleteUser, 
  getAdminDomains, 
  adminAddDomain, 
  adminDeleteDomain, 
  getAdminLogs 
} from '../services/api';

export default function AdminConsolePage() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [domains, setDomains] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newDomain, setNewDomain] = useState('');

  // Fetch all admin panel data
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const uRes = await getAdminUsers();
        setUsers(uRes.users || []);
      } else if (activeTab === 'domains') {
        const dRes = await getAdminDomains();
        setDomains(dRes.domains || []);
      } else if (activeTab === 'logs') {
        const lRes = await getAdminLogs();
        setLogs(lRes.logs || []);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Administrative Fetch Rejected');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleApprove = async (username, currentStatus) => {
    try {
      await adminApproveUser(username, !currentStatus);
      toast.success(`Node ${username} ${!currentStatus ? 'Approved' : 'Suspended'}`);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Approval Update Refused');
    }
  };

  const handleRoleChange = async (username, role) => {
    try {
      await adminUpdateUserRole(username, role);
      toast.success(`Operator ${username} assigned to: ${role.toUpperCase()}`);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Role Modification Refused');
    }
  };

  const handleDelete = async (username) => {
    if (!window.confirm(`Are you sure you want to permanently delete operator ${username}?`)) return;
    try {
      await adminDeleteUser(username);
      toast.success(`Operator ${username} terminated`);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Termination Refused');
    }
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    try {
      await adminAddDomain(newDomain.trim());
      toast.success(`Authorized organization domain added: ${newDomain}`);
      setNewDomain('');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Domain Addition Refused');
    }
  };

  const handleDeleteDomain = async (id) => {
    try {
      await adminDeleteDomain(id);
      toast.success('Authorized domain access revoked');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Revocation Refused');
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-[var(--black)] text-white space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 gap-4">
        <div>
          <span className="text-[10px] font-black text-[var(--em)] tracking-[0.3em] uppercase block">FenceAI SecOps</span>
          <h1 className="text-3xl font-black tracking-tight mt-1 uppercase">ADMINISTRATIVE MASTER CONSOLE</h1>
          <p className="text-muted text-xs mt-1 uppercase tracking-wider opacity-60">Node Security Control, Operator Authorizations, and Forensic Security Auditing</p>
        </div>
        <button 
          onClick={fetchData}
          className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-[var(--em)] hover:text-black rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0 flex items-center gap-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 6H16" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Sync Terminal
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="flex bg-[#0d1117] border border-white/5 p-1.5 rounded-2xl max-w-lg">
        {[
          { id: 'users', label: 'Operator Directory' },
          { id: 'domains', label: 'Approved Domains' },
          { id: 'logs', label: 'Forensic Audit Logs' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all
              ${activeTab === tab.id 
                ? 'bg-[var(--em)] text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                : 'text-muted hover:text-white hover:bg-white/[0.02]'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Tab Content */}
      <div className="bg-[#0d1117] border border-white/5 rounded-3xl p-6 relative overflow-hidden min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 bg-[#0d1117]/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-[var(--em)]/30 border-t-[var(--em)] rounded-full animate-spin" />
              <span className="text-[10px] font-black tracking-[0.35em] text-[var(--em)] uppercase">Securing Master Link...</span>
            </div>
          </div>
        )}

        {/* Tab 1: Operator Directory */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--em)] border-l-2 border-[var(--em)] pl-3 mb-4">Operator Node Directory</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-muted uppercase font-black tracking-widest text-[10px]">
                    <th className="pb-4">Operator Email / Name</th>
                    <th className="pb-4">Role</th>
                    <th className="pb-4">Company</th>
                    <th className="pb-4">Registration</th>
                    <th className="pb-4">System Access</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.username} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 flex items-center gap-3">
                        {u.google_picture ? (
                          <img src={u.google_picture} className="w-8 h-8 rounded-full border border-white/10" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-white text-[10px]">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-white truncate max-w-[200px]">{u.username}</span>
                          <span className="text-[9px] text-muted truncate max-w-[150px] uppercase font-black tracking-wider mt-0.5">{u.full_name || 'System Operator'}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <select
                          value={u.role || 'operator'}
                          onChange={(e) => handleRoleChange(u.username, e.target.value)}
                          className="bg-black/40 border border-white/10 rounded-xl px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--em)] focus:outline-none focus:border-[var(--em)]"
                        >
                          <option value="admin">Admin</option>
                          <option value="operator">Operator</option>
                          <option value="supervisor">Supervisor</option>
                        </select>
                      </td>
                      <td className="py-4">
                        <span className="text-muted uppercase font-bold tracking-wider">{u.company || 'N/A'}</span>
                      </td>
                      <td className="py-4">
                        <span className="text-muted text-[10px]">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Unknown'}
                        </span>
                      </td>
                      <td className="py-4">
                        <button
                          onClick={() => handleApprove(u.username, u.is_approved)}
                          className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all
                            ${u.is_approved 
                              ? 'bg-[var(--em)]/15 border border-[var(--em)]/30 text-[var(--em)] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30' 
                              : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 hover:bg-[var(--em)]/20 hover:text-[var(--em)] hover:border-[var(--em)]/40'}`}
                        >
                          {u.is_approved ? 'AUTHORIZED' : 'PENDING'}
                        </button>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => handleDelete(u.username)}
                          disabled={u.username === sessionStorage.getItem('operator_email')}
                          className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-black border border-red-500/20 hover:border-red-500 rounded-xl text-[10px] font-bold uppercase transition-all disabled:opacity-30 disabled:pointer-events-none"
                          title="Revoke and terminate user credentials"
                        >
                          Terminate
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-muted font-bold uppercase tracking-wider">No Operator Profiles Found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Approved Domains */}
        {activeTab === 'domains' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--em)] border-l-2 border-[var(--em)] pl-3 mb-4">Approved Domains Matrix</h2>
            
            {/* Add Domain Form */}
            <form onSubmit={handleAddDomain} className="flex gap-4 items-end bg-black/20 p-4 border border-white/5 rounded-2xl mb-6">
              <div className="flex-1">
                <label className="text-[9px] font-black text-muted uppercase tracking-widest block mb-2">New Approved Domain Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. kct.ac.in" 
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[var(--em)]"
                />
              </div>
              <button 
                type="submit"
                className="px-6 py-3 bg-[var(--em)] text-black rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all shrink-0 h-[42px]"
              >
                Whitelist Domain
              </button>
            </form>

            {/* List domains */}
            <div className="space-y-3">
              {domains.map(d => (
                <div key={d.id} className="flex items-center justify-between bg-[#111622] border border-white/5 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[var(--em)] shadow-[0_0_10px_var(--em)]" />
                    <span className="font-bold text-white uppercase text-xs tracking-wider">@{d.domain}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteDomain(d.id)}
                    className="text-red-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest p-2 bg-red-500/5 hover:bg-red-500/10 rounded-xl border border-red-500/10 hover:border-red-500/25 transition-all"
                  >
                    Revoke whitelist
                  </button>
                </div>
              ))}
              {domains.length === 0 && (
                <div className="py-12 text-center text-muted font-bold uppercase tracking-wider">No Approved Domains Registered</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Forensic Audit Logs */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--em)] border-l-2 border-[var(--em)] pl-3 mb-4">Forensic SecOps Security Logs</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-muted uppercase font-black tracking-widest text-[10px]">
                    <th className="pb-4">Timestamp</th>
                    <th className="pb-4">Operator ID</th>
                    <th className="pb-4">Action Event</th>
                    <th className="pb-4">Network IP / User Agent</th>
                    <th className="pb-4 text-right">Diagnostic Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map(log => {
                    const isSuccess = log.action.includes('success');
                    const isFailure = log.action.includes('failed');
                    
                    return (
                      <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-4 pr-4">
                          <span className="text-muted text-[10px] whitespace-nowrap">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 pr-4">
                          <span className="font-bold text-white whitespace-nowrap">{log.username || 'System Node'}</span>
                        </td>
                        <td className="py-4 pr-4">
                          <span className={`px-2 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap
                            ${isSuccess ? 'bg-[var(--em)]/15 border border-[var(--em)]/30 text-[var(--em)]' : ''}
                            ${isFailure ? 'bg-red-500/15 border border-red-500/30 text-red-500' : ''}
                            ${!isSuccess && !isFailure ? 'bg-white/10 border border-white/20 text-white' : ''}
                          `}>
                            {log.action.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 pr-4 max-w-[200px] truncate">
                          <div className="flex flex-col min-w-0">
                            <span className="font-mono text-muted leading-tight text-[10px]">{log.ip_address || '127.0.0.1'}</span>
                            <span className="text-[8px] text-muted truncate mt-0.5 opacity-55 uppercase font-black tracking-wide">{log.user_agent || 'Internal API Agent'}</span>
                          </div>
                        </td>
                        <td className="py-4 text-right font-mono text-[10px] text-white/70 max-w-[300px] truncate">
                          {log.details || 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-muted font-bold uppercase tracking-wider">No Security Event Logs Audited</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
