import React, { useState } from 'react';
import './index.css';
import Login from './Login';
import Chat from './Chat';
import TaskBoard from './TaskBoard';
import AdminPanel from './AdminPanel';
import Profile from './Profile';
import LiveBg from './LiveBg';
import { useTheme } from './theme';

const NAV = [
  { id:'chat',    label:'Chat',    icon:ChatIcon    },
  { id:'tasks',   label:'Tasks',   icon:TaskIcon    },
  { id:'admin',   label:'Team',    icon:TeamIcon,   adminOnly:true },
  { id:'profile', label:'Profile', icon:UserIcon    },
];

export default function App() {
  const [user,        setUser]        = useState(() => { try { return JSON.parse(localStorage.getItem('xv_user'))||null; } catch { return null; } });
  const [tab,         setTab]         = useState('chat');
  const [sideOpen,    setSideOpen]    = useState(false);
  const [tasks,       setTasks]       = useState([]);
  const { theme, toggle } = useTheme();

  function handleLogin(u) { setUser(u); localStorage.setItem('xv_user', JSON.stringify(u)); }
  function handleLogout()  { setUser(null); localStorage.removeItem('xv_user'); setTab('chat'); }
  function handleProfileUpdate(u) { setUser(u); }

  function navTo(id) { setTab(id); setSideOpen(false); }

  if (!user) return (
    <>
      <LiveBg/>
      <Login onLogin={handleLogin}/>
    </>
  );

  const tabs = NAV.filter(n => !n.adminOnly || user.role==='admin');

  return (
    <>
      <LiveBg/>
      <div className="xv-app">
        {/* Mobile overlay */}
        <div className={`xv-sidebar-overlay${sideOpen?' open':''}`} onClick={() => setSideOpen(false)}/>

        {/* Hamburger */}
        <button className="xv-hamburger" onClick={() => setSideOpen(p=>!p)}>
          <MenuIcon size={18}/>
        </button>

        {/* Sidebar */}
        <aside className={`xv-sidebar${sideOpen?' open':''}`}>
          <div>
            <div className="xv-logo-wrap">
              <div className="xv-logo">
                <div className="xv-logo-mark">XX</div>
                <div>
                  <div className="xv-logo-text">Xarvo <span className="xv-logo-x">X</span></div>
                  <div style={{ fontSize:9, color:'var(--text-muted)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Operations Platform</div>
                </div>
              </div>
            </div>
            <nav className="xv-nav">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => navTo(t.id)}
                  className={`xv-nav-btn${tab===t.id?' active':''}`}
                >
                  <t.icon size={15}/>
                  <span>{t.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="xv-side-bottom">
            <button className="xv-theme-btn" onClick={toggle} title={`Switch to ${theme==='dark'?'light':'dark'} mode`}>
              {theme==='dark' ? <SunIcon size={14}/> : <MoonIcon size={14}/>}
            </button>
            <div className="xv-user-card" onClick={() => navTo('profile')}>
              <div className="xv-user-avatar" style={{ background:avatarColor(user.username) }}>
                {user.avatar ? (
                  <img src={user.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%' }}/>
                ) : (
                  user.username[0]?.toUpperCase()
                )}
              </div>
              <div style={{ overflow:'hidden', minWidth:0 }}>
                <div className="xv-user-name">{user.username}</div>
                <div className="xv-user-role">{user.role}</div>
              </div>
            </div>
            <button className="xv-logout-btn" onClick={handleLogout} title="Sign out">
              <LogoutIcon size={13}/>
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="xv-main" style={{ paddingTop: 0 }}>
          {tab==='chat'    && <Chat user={user}/>}
          {tab==='tasks'   && <TaskBoard user={user} onTasksLoaded={setTasks}/>}
          {tab==='admin'   && user.role==='admin' && <AdminPanel user={user}/>}
          {tab==='profile' && <Profile user={user} onUpdate={handleProfileUpdate} tasks={tasks}/>}
        </main>
      </div>
    </>
  );
}

function avatarColor(str) {
  let h=0; for(let i=0;i<(str||'').length;i++) h=str.charCodeAt(i)+((h<<5)-h);
  const c=['#00b8cc','#8b7cf8','#4ade80','#f87171','#fbbf24','#60a5fa'];
  return c[Math.abs(h)%c.length];
}

/* ── Icons ── */
function ChatIcon({size=16}){ return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
function TaskIcon({size=16}){ return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>; }
function TeamIcon({size=16}){ return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function UserIcon({size=16}){ return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function LogoutIcon({size=13}){ return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function SunIcon({size=14}){ return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>; }
function MoonIcon({size=14}){ return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>; }
function MenuIcon({size=18}){ return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>; }
