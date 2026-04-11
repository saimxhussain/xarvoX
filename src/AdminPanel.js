import React, { useState, useEffect } from 'react';
import { api } from './api';

function avatarColor(str) {
  let h=0; for(let i=0;i<(str||'').length;i++) h=str.charCodeAt(i)+((h<<5)-h);
  const c=['#00b8cc','#8b7cf8','#4ade80','#f87171','#fbbf24','#60a5fa'];
  return c[Math.abs(h)%c.length];
}

export default function AdminPanel({ user }) {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [form,     setForm]     = useState({ name:'', password:'', role:'worker' });
  const [creating, setCreating] = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    try { const r = await api.getUsers(); if(r.success) setUsers(r.users); } catch {}
    setLoading(false);
  }

  async function createUser(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.password.trim()) return;
    setCreating(true); setError(''); setSuccess('');
    const userId   = `xarvo@${form.name.trim().toLowerCase().replace(/\s+/g,'')}`;
    const passHash = 'HASH:' + btoa(form.password);
    try {
      await api.createUser({ admin_id:user.user_id, new_user_id:userId, new_username:form.name.trim(), password_hash:passHash, role:form.role });
      setSuccess(`Created ${userId} — they can log in immediately.`);
      setForm({ name:'', password:'', role:'worker' });
      loadUsers();
    } catch { setError('Failed to create user.'); }
    setCreating(false);
  }

  const inp = { width:'100%', background:'var(--bg-input)', border:'1px solid var(--border-mid)', borderRadius:9, padding:'10px 14px', fontSize:13, color:'var(--text-primary)', fontFamily:'var(--font-body)', outline:'none', transition:'border-color 0.15s' };

  return (
    <div className="xv-admin-wrap">
      <div className="xv-admin-header">
        <div className="xv-admin-title">Team Management</div>
        <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:4 }}>Admin · {users.length} members</div>
      </div>

      {/* Create user */}
      <div className="xv-admin-card">
        <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, color:'var(--text-primary)', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
          <span>➕</span> Add New Member
        </div>
        <form onSubmit={createUser}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:12, marginBottom:12 }}>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>Name</label>
              <input style={inp} placeholder="e.g. john" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
              {form.name && <div style={{ fontSize:10, color:'var(--accent)', marginTop:3 }}>ID: xarvo@{form.name.toLowerCase().replace(/\s+/g,'')}</div>}
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>Password</label>
              <input style={inp} type="password" placeholder="Set a password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
            </div>
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>Role</label>
              <select style={{ ...inp, color:'var(--text-primary)' }} value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                <option value="worker">Worker</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          {error   && <div style={{ background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.25)', borderRadius:8, padding:'8px 14px', fontSize:12, color:'var(--red)', marginBottom:10 }}>{error}</div>}
          {success && <div style={{ background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.25)', borderRadius:8, padding:'8px 14px', fontSize:12, color:'var(--green)', marginBottom:10 }}>{success}</div>}
          <button type="submit" disabled={creating} style={{ background:'linear-gradient(135deg,var(--accent),var(--purple))', color:'#080b10', border:'none', borderRadius:9, padding:'10px 20px', fontSize:13, fontWeight:700, fontFamily:'var(--font-display)', cursor:'pointer', opacity:creating?0.7:1 }}>
            {creating ? 'Creating…' : '+ Create Account'}
          </button>
        </form>
      </div>

      {/* User list */}
      <div className="xv-admin-card">
        <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:14, color:'var(--text-primary)', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
          <span>👥</span> All Members
        </div>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:20 }}><div className="xv-spinner"/></div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {users.map(u => (
              <div key={u.user_id} className="xv-user-row-item">
                <div style={{ width:36, height:36, borderRadius:'50%', background:avatarColor(u.username), display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#080b10', fontFamily:'var(--font-display)', flexShrink:0 }}>
                  {u.username[0].toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{u.username}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{u.user_id}</div>
                </div>
                <div style={{ padding:'3px 12px', borderRadius:20, border:'1px solid', fontSize:11, fontWeight:700, fontFamily:'var(--font-display)', letterSpacing:'0.04em', background: u.role==='admin'?'rgba(139,124,248,0.12)':'rgba(0,229,255,0.08)', color: u.role==='admin'?'var(--purple)':'var(--accent)', borderColor: u.role==='admin'?'rgba(139,124,248,0.3)':'rgba(0,229,255,0.2)' }}>
                  {u.role}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
