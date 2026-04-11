import React, { useState, useEffect, useRef } from 'react';
import { api } from './api';

function avatarColor(str) {
  let h=0; for(let i=0;i<(str||'').length;i++) h=str.charCodeAt(i)+((h<<5)-h);
  const c=['#00b8cc','#8b7cf8','#4ade80','#f87171','#fbbf24','#60a5fa'];
  return c[Math.abs(h)%c.length];
}

export default function Chat({ user }) {
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const bottomRef = useRef();
  const pollRef   = useRef();

  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, []); // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  async function loadMessages() {
    try {
      const r = await api.getMessages();
      if (r.success) { setMessages(r.messages || []); }
    } catch {}
    setLoading(false);
  }

  async function send() {
    if (!text.trim()) return;
    const msg = {
      message_id: Date.now().toString(),
      user_id: user.user_id,
      username: user.username,
      text: text.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages(p => [...p, msg]);
    setText('');
    await api.sendMessage({ user_id: user.user_id, username: user.username, text: msg.text });
  }

  function fmtTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  }

  return (
    <div className="xv-chat-root">
      {/* Header */}
      <div className="xv-chat-header">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--green)', boxShadow:'0 0 8px var(--green)', animation:'pulse 2s infinite' }}/>
          <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:15, color:'var(--text-primary)' }}>Team Chat</span>
        </div>
        <span style={{ fontSize:12, color:'var(--text-muted)' }}>{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div className="xv-chat-messages">
        {loading ? (
          <div className="xv-loading" style={{ flex:'unset', marginTop:40 }}>
            <div className="xv-spinner"/>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign:'center', color:'var(--text-muted)', fontSize:14, marginTop:60 }}>
            <div style={{ fontSize:32, marginBottom:12 }}>💬</div>
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.user_id === user.user_id;
            const showAvatar = i===0 || messages[i-1].user_id !== msg.user_id;
            return (
              <div key={msg.message_id || i} className={`xv-msg${isOwn?' own':''}`}>
                {!isOwn && (
                  <div className="xv-msg-avatar" style={{ background: avatarColor(msg.username), visibility: showAvatar?'visible':'hidden' }}>
                    {msg.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  {showAvatar && !isOwn && (
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:3, paddingLeft:2 }}>@{msg.username}</div>
                  )}
                  <div className="xv-msg-bubble">{msg.text}</div>
                  <div className={`xv-msg-meta`}>{fmtTime(msg.created_at)}</div>
                </div>
                {isOwn && (
                  <div className="xv-msg-avatar" style={{ background: avatarColor(msg.username), visibility: showAvatar?'visible':'hidden' }}>
                    {msg.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="xv-chat-input-wrap">
        <textarea
          className="xv-chat-textarea"
          placeholder={`Message the team…`}
          value={text}
          rows={1}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} }}
          style={{ height: text.split('\n').length > 1 ? 'auto' : '42px' }}
        />
        <button className="xv-chat-send" onClick={send} disabled={!text.trim()} title="Send">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
