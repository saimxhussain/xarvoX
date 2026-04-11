import React, { useState, useRef } from 'react';
import { api } from './api';

function avatarColor(str) {
  let h=0; for(let i=0;i<(str||'').length;i++) h=str.charCodeAt(i)+((h<<5)-h);
  const c=['#00b8cc','#8b7cf8','#4ade80','#f87171','#fbbf24','#60a5fa'];
  return c[Math.abs(h)%c.length];
}

export default function Profile({ user, onUpdate, tasks = [] }) {
  const [name,     setName]     = useState(user.username||'');
  const [email,    setEmail]    = useState(user.email||'');
  const [phone,    setPhone]    = useState(user.phone||'');
  const [bio,      setBio]      = useState(user.bio||'');
  const [avatar,   setAvatar]   = useState(user.avatar||null);
  const [saved,    setSaved]    = useState(false);
  const fileRef = useRef();

  // Progress stats from tasks
  const myTasks   = tasks.filter(t => t.user_id === user.user_id && t.status !== 'archived');
  const done      = myTasks.filter(t => t.status === 'done').length;
  const inProg    = myTasks.filter(t => t.status === 'in_progress').length;
  const todo      = myTasks.filter(t => t.status === 'todo').length;
  const total     = myTasks.length;
  const donePct   = total ? Math.round((done/total)*100) : 0;

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  }

  function save() {
    const updated = { ...user, username:name, email, phone, bio, avatar };
    localStorage.setItem('xv_user', JSON.stringify(updated));
    onUpdate?.(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const bg = avatarColor(name);

  return (
    <div className="xv-profile-wrap">
      <div className="xv-profile-header">
        <div className="xv-profile-title">My Profile</div>
        <div className="xv-profile-sub">Manage your personal info and preferences</div>
      </div>

      <div className="xv-profile-grid">
        {/* Left panel */}
        <div className="xv-profile-left">
          <div style={{ position:'relative' }}>
            {avatar ? (
              <img src={avatar} alt="avatar" style={{ width:88, height:88, borderRadius:'50%', objectFit:'cover', border:'3px solid var(--accent)', boxShadow:'0 0 20px var(--accent-glow)' }}/>
            ) : (
              <div style={{ width:88, height:88, borderRadius:'50%', background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, fontWeight:700, color:'#080b10', border:'3px solid var(--accent)', fontFamily:'var(--font-display)', boxShadow:'0 0 20px var(--accent-glow)' }}>
                {name[0]?.toUpperCase()}
              </div>
            )}
            <button onClick={() => fileRef.current.click()} style={{ position:'absolute', bottom:0, right:0, width:28, height:28, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid var(--bg-base)', cursor:'pointer' }}>
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#080b10" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
          </div>
          <input type="file" accept="image/*" ref={fileRef} style={{ display:'none' }} onChange={handleAvatarChange}/>

          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:17, color:'var(--text-primary)' }}>{name||'Your Name'}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{user.user_id}</div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:5, marginTop:10, background: user.role==='admin'?'rgba(139,124,248,0.12)':'rgba(0,229,255,0.08)', border:`1px solid ${user.role==='admin'?'var(--purple)':'var(--accent)'}`, color: user.role==='admin'?'var(--purple)':'var(--accent)', padding:'3px 14px', borderRadius:20, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>
              {user.role}
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-secondary)' }}>
              <span>Task Completion</span>
              <span style={{ color:'var(--accent)', fontWeight:700 }}>{donePct}%</span>
            </div>
            <div className="xv-progress-bar-wrap">
              <div className="xv-progress-bar-fill" style={{ width:`${donePct}%`, background:'linear-gradient(90deg,var(--accent),var(--purple))' }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)' }}>
              <span>{done} done</span>
              <span>{inProg} in progress</span>
              <span>{todo} todo</span>
            </div>
          </div>
        </div>

        {/* Right panels */}
        <div style={{ flex:1, minWidth:280, display:'flex', flexDirection:'column', gap:16 }}>

          {/* Progress / Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {[
              { label:'Total Tasks',   value:total,  color:'var(--accent)',  icon:'📋' },
              { label:'Completed',     value:done,   color:'var(--green)',   icon:'✅' },
              { label:'In Progress',   value:inProg, color:'var(--amber)',   icon:'⚡' },
            ].map(s => (
              <div key={s.label} className="xv-progress-card">
                <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
                <div className="xv-stat-num" style={{ color:s.color }}>{s.value}</div>
                <div className="xv-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Basic info */}
          <div className="xv-profile-card">
            <div className="xv-section-title">
              <span>👤</span> Basic Information
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                <label className="xv-field-label">Display Name</label>
                <input className="xv-field-input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/>
              </div>
              <div>
                <label className="xv-field-label">User ID</label>
                <input className="xv-field-input" value={user.user_id} readOnly/>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label className="xv-field-label">Bio</label>
                <textarea className="xv-field-input" value={bio} onChange={e=>setBio(e.target.value)} placeholder="Tell your team about yourself…" rows={2} style={{ resize:'vertical' }}/>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="xv-profile-card">
            <div className="xv-section-title">
              <span>📬</span> Contact Details
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                <label className="xv-field-label">Work Email</label>
                <input className="xv-field-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@xarvox.com"/>
              </div>
              <div>
                <label className="xv-field-label">Phone</label>
                <input className="xv-field-input" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+1 234 567 8900"/>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="xv-profile-card">
            <div className="xv-section-title">
              <span>🔐</span> Security
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                <label className="xv-field-label">Current Password</label>
                <input className="xv-field-input" type="password" placeholder="••••••••"/>
              </div>
              <div>
                <label className="xv-field-label">New Password</label>
                <input className="xv-field-input" type="password" placeholder="••••••••"/>
              </div>
            </div>
            <button style={{ marginTop:14, background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.25)', color:'var(--red)', borderRadius:8, padding:'7px 16px', fontSize:12, fontWeight:600, cursor:'pointer' }}>Change Password</button>
          </div>

          {/* Save */}
          <button onClick={save} style={{ background: saved?'var(--green)':'linear-gradient(135deg,var(--accent),var(--purple))', border:'none', borderRadius:var_radius, padding:'12px 28px', fontSize:14, fontWeight:700, color:'#080b10', fontFamily:'var(--font-display)', cursor:'pointer', transition:'all 0.2s', letterSpacing:'0.02em', alignSelf:'flex-start', boxShadow: saved?'0 4px 20px rgba(74,222,128,0.3)':'0 4px 20px var(--accent-glow)' }}>
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

const var_radius = 'var(--radius)';
