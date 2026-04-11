import React, { useState } from 'react';
import { api } from './api';

export default function Login({ onLogin }) {
  const [userId,   setUserId]   = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId || !password) return;
    setLoading(true); setError('');
    try {
      const hash = 'HASH:' + btoa(password);
      const res  = await api.login(userId, hash);
      if (res.success) { onLogin(res.user); }
      else { setError(res.error || 'Invalid credentials'); }
    } catch { setError('Cannot reach server. Check your API deployment.'); }
    setLoading(false);
  }

  return (
    <div className="xv-login-wrap">
      <div className="xv-login-card">
        {/* Logo */}
        <div className="xv-login-logo">
          <div className="xv-logo-mark">XX</div>
          <div>
            <div className="xv-logo-text">
              Xarvo <span className="xv-logo-x">X</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Operations Platform
            </div>
          </div>
        </div>

        <div className="xv-login-headline">Welcome back</div>
        <div className="xv-login-sub">Sign in to your workspace</div>

        <form onSubmit={handleSubmit}>
          <div className="xv-field">
            <label className="xv-label">Worker ID</label>
            <input
              className="xv-input"
              type="text"
              placeholder="xarvo@yourname"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="xv-field">
            <label className="xv-label">Password</label>
            <input
              className="xv-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="xv-error">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="xv-btn-primary"
            style={{ marginTop: 8 }}
          >
            {loading ? <Spinner /> : 'Sign in →'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 18, height: 18,
      border: '2px solid rgba(8,11,16,0.3)',
      borderTopColor: '#080b10',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block',
    }}/>
  );
}
