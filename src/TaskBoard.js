import React, { useState, useEffect, useRef } from 'react';
import { api } from './api';
import { v4 as uuidv4 } from './uuid';

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       accent: '#7a90b8' },
  { id: 'in_progress', label: 'In Progress',  accent: '#00e5ff' },
  { id: 'done',        label: 'Done',         accent: '#4ade80' },
];

const LABEL_OPTIONS = [
  { name: 'Bug',     color: '#ae2e24' },
  { name: 'Feature', color: '#0055cc' },
  { name: 'Design',  color: '#6e374a' },
  { name: 'Urgent',  color: '#974f0c' },
  { name: 'Review',  color: '#1f845a' },
  { name: 'Logo',    color: '#5a3e9a' },
];

function fmtTime(iso) {
  if (!iso) return '';
  const diff = (new Date() - new Date(iso)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export default function TaskBoard({ user }) {
  const [tasks,    setTasks]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [users,    setUsers]    = useState([]);
  const [adding,   setAdding]   = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [openCard, setOpenCard] = useState(null);

  useEffect(() => { loadTasks(); if (user.role==='admin') loadUsers(); }, []); // eslint-disable-line

  async function loadTasks() {
    setLoading(true);
    try { const r = await api.getTasks(user.user_id, user.role); if (r.success) setTasks(r.tasks||[]); } catch {}
    setLoading(false);
  }
  async function loadUsers() {
    try { const r = await api.getUsers(); if (r.success) setUsers(r.users.filter(u=>u.role==='worker')); } catch {}
  }
  async function addTask(colId) {
    if (!newTitle.trim()) return;
    const uid   = user.role==='admin' && assignTo ? assignTo : user.user_id;
    const uname = users.find(u=>u.user_id===uid)?.username || user.username;
    const task  = {
      task_id: uuidv4(), user_id: uid, username: uname,
      title: newTitle.trim(), description: '', status: colId,
      assigned_by: user.user_id, labels: [], comments: [], checklist: [],
      due_date: null, cover: null, completed: false,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    setTasks(p => [...p, task]);
    setAdding(null); setNewTitle(''); setAssignTo('');
    await api.createTask(task);
  }
  async function moveTask(taskId, newStatus) {
    setTasks(p => p.map(t => t.task_id===taskId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t));
    await api.updateTask({ task_id: taskId, status: newStatus });
  }
  async function deleteTask(taskId) {
    setTasks(p => p.filter(t => t.task_id!==taskId));
    setOpenCard(null);
    await api.updateTask({ task_id: taskId, status: 'archived' });
  }
  function patchTask(taskId, patch) {
    setTasks(p => p.map(t => t.task_id===taskId ? { ...t, ...patch, updated_at: new Date().toISOString() } : t));
    api.updateTask({ task_id: taskId, ...patch });
  }

  function onDragStart(e, id) { setDragging(id); e.dataTransfer.effectAllowed='move'; }
  function onDragOver(e, id)  { e.preventDefault(); setDragOver(id); }
  function onDrop(e, id)      { e.preventDefault(); if (dragging) moveTask(dragging, id); setDragging(null); setDragOver(null); }

  const openTaskData = tasks.find(t => t.task_id===openCard);

  if (loading) return (
    <div className="xv-loading">
      <div className="xv-spinner"/>
      <span className="xv-load-txt">Loading board…</span>
    </div>
  );

  return (
    <div className="xv-board-root">
      {/* Header */}
      <div className="xv-board-bar">
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <TaskIcon size={16} color="var(--accent)"/>
          <span className="xv-board-name">Task Board</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span className="xv-meta-pill">{user.role==='admin'?'All workers':`@${user.username}`}</span>
          <span className="xv-meta-pill">{tasks.filter(t=>t.status!=='archived').length} cards</span>
          <button className="xv-icon-btn" onClick={loadTasks} title="Refresh">
            <Ico d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10M23 4v6h-6" s={13}/>
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div className="xv-board">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status===col.id);
          return (
            <div
              key={col.id}
              className={`xv-col${dragOver===col.id?' drag-over':''}`}
              onDragOver={e => onDragOver(e, col.id)}
              onDrop={e => onDrop(e, col.id)}
              onDragLeave={() => setDragOver(null)}
            >
              <div className="xv-col-head">
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:col.accent, boxShadow:`0 0 6px ${col.accent}` }}/>
                  <span className="xv-col-title">{col.label}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span className="xv-col-count">{colTasks.length}</span>
                  <button className="xv-icon-btn" title="Options" style={{ width:22, height:22 }}>
                    <Ico d="M12 5v.01M12 12v.01M12 19v.01" s={14}/>
                  </button>
                </div>
              </div>

              <div className="xv-card-list">
                {colTasks.map(task => (
                  <KanbanCard
                    key={task.task_id} task={task}
                    isDragging={dragging===task.task_id}
                    onDragStart={onDragStart}
                    onDragEnd={() => { setDragging(null); setDragOver(null); }}
                    onClick={() => setOpenCard(task.task_id)}
                  />
                ))}
              </div>

              {adding===col.id ? (
                <AddCardForm
                  user={user} users={users}
                  newTitle={newTitle} setNewTitle={setNewTitle}
                  assignTo={assignTo} setAssignTo={setAssignTo}
                  onAdd={() => addTask(col.id)}
                  onCancel={() => { setAdding(null); setNewTitle(''); setAssignTo(''); }}
                />
              ) : (
                <button className="xv-add-card-btn" onClick={() => setAdding(col.id)}>
                  <span style={{ fontSize:16, fontWeight:300 }}>+</span> Add a card
                </button>
              )}
            </div>
          );
        })}
        <button className="xv-add-list-btn">
          <span style={{ fontSize:16 }}>+</span> Add another list
        </button>
      </div>

      {openCard && openTaskData && (
        <CardModal
          task={openTaskData} user={user} users={users} columns={COLUMNS}
          onClose={() => setOpenCard(null)}
          onMove={moveTask} onDelete={deleteTask} onPatch={patchTask}
        />
      )}
    </div>
  );
}

/* ── Kanban Card ── */
function KanbanCard({ task, isDragging, onDragStart, onDragEnd, onClick }) {
  const [hov, setHov] = useState(false);
  const labels    = Array.isArray(task.labels)    ? task.labels    : [];
  const checklist = Array.isArray(task.checklist) ? task.checklist : [];
  const comments  = Array.isArray(task.comments)  ? task.comments  : [];
  const checkDone = checklist.filter(c=>c.done).length;

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, task.task_id)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className={`xv-card${isDragging?' dragging':''}`}
    >
      {task.cover && (
        <div className="xv-card-cover" style={{ background: task.cover.startsWith('#') ? task.cover : undefined }}>
          {!task.cover.startsWith('#') && <img src={task.cover} alt=""/>}
        </div>
      )}
      {labels.length > 0 && (
        <div className="xv-card-labels">
          {labels.map(l => {
            const lo = LABEL_OPTIONS.find(x=>x.name===l);
            return lo ? <span key={l} className="xv-label-chip" style={{ background:lo.color }}>{l}</span> : null;
          })}
        </div>
      )}
      <div className="xv-card-title">{task.title}</div>
      <div className="xv-card-footer">
        <div className="xv-card-badges">
          {task.completed && <span className="xv-badge" style={{ color:'var(--green)' }}><Ico d="M20 6 9 17l-5-5" s={9}/></span>}
          {task.due_date  && <span className="xv-badge"><Ico d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" s={9}/> {new Date(task.due_date).toLocaleDateString()}</span>}
          {comments.length>0 && <span className="xv-badge"><Ico d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" s={9}/> {comments.length}</span>}
          {checklist.length>0 && (
            <span className="xv-badge" style={{ color: checkDone===checklist.length ? 'var(--green)' : undefined }}>
              <Ico d="M9 11l3 3L22 4" s={9}/> {checkDone}/{checklist.length}
            </span>
          )}
        </div>
        <div className="xv-card-avatar" style={{ background:avatarColor(task.username) }} title={`@${task.username}`}>
          {task.username[0].toUpperCase()}
        </div>
      </div>
      {hov && (
        <button className="xv-card-edit-btn" onClick={e => e.stopPropagation()}>
          <Ico d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" s={10}/>
        </button>
      )}
    </div>
  );
}

/* ── Add Card Form ── */
function AddCardForm({ user, users, newTitle, setNewTitle, assignTo, setAssignTo, onAdd, onCancel }) {
  const ref = useRef();
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="xv-add-form">
      <textarea
        ref={ref} rows={3} value={newTitle}
        placeholder="Enter a title for this card…"
        className="xv-add-form-input"
        onChange={e => setNewTitle(e.target.value)}
        onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();onAdd();} if(e.key==='Escape')onCancel(); }}
      />
      {user.role==='admin' && users.length>0 && (
        <select className="xv-add-form-select" value={assignTo} onChange={e => setAssignTo(e.target.value)}>
          <option value="">Assign to myself</option>
          {users.map(u => <option key={u.user_id} value={u.user_id}>{u.username}</option>)}
        </select>
      )}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <button className="xv-add-form-submit" onClick={onAdd}>Add card</button>
        <button className="xv-add-form-cancel" onClick={onCancel}>✕</button>
      </div>
    </div>
  );
}

/* ── Card Modal ── */
function CardModal({ task, user, users, columns, onClose, onMove, onDelete, onPatch }) {
  const canEdit = user.role==='admin' || task.user_id===user.user_id;
  const [title,       setTitle]       = useState(task.title);
  const [editTitle,   setEditTitle]   = useState(false);
  const [desc,        setDesc]        = useState(task.description||'');
  const [editDesc,    setEditDesc]    = useState(false);
  const [comment,     setComment]     = useState('');
  const [showLabels,  setShowLabels]  = useState(false);
  const [showDate,    setShowDate]    = useState(false);
  const [showCheck,   setShowCheck]   = useState(false);
  const [showMove,    setShowMove]    = useState(false);
  const [showCover,   setShowCover]   = useState(false);
  const [newCheck,    setNewCheck]    = useState('');
  const [addingCheck, setAddingCheck] = useState(false);
  const [coverInput,  setCoverInput]  = useState(task.cover||'');
  const [dateInput,   setDateInput]   = useState(task.due_date?task.due_date.slice(0,10):'');

  const comments  = Array.isArray(task.comments)  ? task.comments  : [];
  const checklist = Array.isArray(task.checklist) ? task.checklist : [];
  const labels    = Array.isArray(task.labels)    ? task.labels    : [];
  const checkDone = checklist.filter(c=>c.done).length;
  const checkPct  = checklist.length ? Math.round((checkDone/checklist.length)*100) : 0;

  function saveTitle()  { if(title.trim()&&title!==task.title) onPatch(task.task_id,{title:title.trim()}); setEditTitle(false); }
  function saveDesc()   { onPatch(task.task_id,{description:desc.trim()}); setEditDesc(false); }
  function addComment() {
    if(!comment.trim()) return;
    const c = { id:uuidv4(), user:user.username, text:comment.trim(), created_at:new Date().toISOString() };
    onPatch(task.task_id,{comments:[...comments,c]}); setComment('');
  }
  function toggleLabel(name) {
    const next = labels.includes(name) ? labels.filter(l=>l!==name) : [...labels,name];
    onPatch(task.task_id,{labels:next});
  }
  function addCheckItem() {
    if(!newCheck.trim()) return;
    onPatch(task.task_id,{checklist:[...checklist,{id:uuidv4(),text:newCheck.trim(),done:false}]});
    setNewCheck(''); setAddingCheck(false);
  }
  function toggleCheck(id) { onPatch(task.task_id,{checklist:checklist.map(c=>c.id===id?{...c,done:!c.done}:c)}); }
  function deleteCheck(id) { onPatch(task.task_id,{checklist:checklist.filter(c=>c.id!==id)}); }

  const mo = { padding: '10px 14px', borderRadius: 8, background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:12, display:'flex', alignItems:'center', gap:6, cursor:'pointer', transition:'all 0.15s', fontFamily:'var(--font-body)', fontWeight:500 };
  const sideHead = { fontSize:10, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 };
  const currentCol = columns.find(c=>c.id===task.status);

  return (
    <div className="xv-overlay" onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div className="xv-modal">
        {task.cover && (
          <div style={{ height:140, borderRadius:'22px 22px 0 0', overflow:'hidden', background: task.cover.startsWith('#')?task.cover:undefined }}>
            {!task.cover.startsWith('#') && <img src={task.cover} alt="cover" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>}
          </div>
        )}

        {/* Header */}
        <div style={{ padding:'18px 18px 0', display:'flex', alignItems:'flex-start', gap:12 }}>
          <button
            style={{ width:24, height:24, borderRadius:'50%', border:`2px solid ${task.completed?'var(--green)':'var(--border-strong)'}`, background: task.completed?'var(--green)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, marginTop:3, transition:'all 0.15s', color:'#080b10' }}
            onClick={() => onPatch(task.task_id,{completed:!task.completed})}
          >
            {task.completed && <Ico d="M20 6 9 17l-5-5" s={12}/>}
          </button>
          <div style={{ flex:1 }}>
            {editTitle && canEdit ? (
              <input
                autoFocus style={{ width:'100%', fontSize:18, fontWeight:700, color:'var(--text-primary)', background:'var(--bg-input)', border:'1px solid var(--accent)', borderRadius:8, padding:'4px 10px', fontFamily:'var(--font-display)', boxSizing:'border-box', outline:'none' }}
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter')saveTitle(); if(e.key==='Escape'){setEditTitle(false);setTitle(task.title);} }}
                onBlur={saveTitle}
              />
            ) : (
              <div
                style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', fontFamily:'var(--font-display)', letterSpacing:'-0.02em', cursor:canEdit?'pointer':'default', textDecoration:task.completed?'line-through':'none', opacity:task.completed?0.6:1 }}
                onClick={() => canEdit&&setEditTitle(true)}
              >{task.title}</div>
            )}
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4, display:'flex', alignItems:'center', gap:5 }}>
              in list
              <select style={{ background:'transparent', border:'none', borderBottom:'1px solid var(--border-mid)', color:'var(--text-secondary)', fontSize:12, cursor:'pointer', outline:'none', fontFamily:'var(--font-body)' }} value={task.status} onChange={e=>onMove(task.task_id,e.target.value)}>
                {columns.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <button style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:20, cursor:'pointer', padding:'0 4px', lineHeight:1 }} onClick={onClose}>✕</button>
        </div>

        <div style={{ display:'flex', padding:'14px 6px 18px', gap:0 }}>
          {/* Main */}
          <div style={{ flex:1, padding:'0 12px', display:'flex', flexDirection:'column', gap:0, overflowY:'auto', maxHeight:'60vh' }}>

            {/* Toolbar */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
              {[
                { icon:"M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", label:'Dates',    fn:()=>{setShowDate(p=>!p);setShowLabels(false);setShowCheck(false);setShowCover(false);} },
                { icon:"M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11", label:'Checklist', fn:()=>{setShowCheck(true);setShowDate(false);setShowLabels(false);setShowCover(false);} },
              ].map(b => (
                <div key={b.label} style={{ position:'relative' }}>
                  <button style={mo} onClick={b.fn}><Ico d={b.icon} s={13}/>{b.label}</button>
                  {b.label==='Dates' && showDate && (
                    <div style={{ position:'absolute', zIndex:200, background:'var(--bg-overlay)', border:'1px solid var(--border-mid)', borderRadius:12, padding:'14px', minWidth:200, boxShadow:'var(--shadow)', top:'110%', left:0 }}>
                      <div style={sideHead}>Due Date</div>
                      <input type="date" value={dateInput} onChange={e=>setDateInput(e.target.value)} style={{ width:'100%', background:'var(--bg-input)', border:'1px solid var(--border-mid)', borderRadius:7, padding:'7px 10px', fontSize:13, color:'var(--text-primary)', fontFamily:'var(--font-body)', outline:'none', marginBottom:8 }}/>
                      <div style={{ display:'flex', gap:6 }}>
                        <button style={{ background:'linear-gradient(135deg,var(--accent),var(--purple))', color:'#080b10', border:'none', borderRadius:7, padding:'6px 14px', fontSize:12, fontWeight:700, cursor:'pointer' }} onClick={() => { onPatch(task.task_id,{due_date:dateInput||null}); setShowDate(false); }}>Save</button>
                        {task.due_date && <button style={{ background:'none', border:'1px solid var(--red)', color:'var(--red)', borderRadius:7, padding:'6px 10px', fontSize:12, cursor:'pointer' }} onClick={() => { onPatch(task.task_id,{due_date:null}); setShowDate(false); }}>Remove</button>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Members + Labels */}
            <div style={{ display:'flex', gap:20, marginBottom:14, flexWrap:'wrap' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <div style={sideHead}>Members</div>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:avatarColor(task.username), display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#080b10' }}>{task.username[0].toUpperCase()}</div>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5, position:'relative' }}>
                <div style={sideHead}>Labels</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                  {labels.map(l => { const lo=LABEL_OPTIONS.find(x=>x.name===l); return lo?<span key={l} style={{ fontSize:11, fontWeight:700, color:'#fff', padding:'2px 8px', borderRadius:4, background:lo.color }}>{l}</span>:null; })}
                  <button style={{ width:28, height:28, borderRadius:'50%', background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setShowLabels(p=>!p)}>+</button>
                </div>
                {showLabels && (
                  <div style={{ position:'absolute', zIndex:200, top:'100%', left:0, background:'var(--bg-overlay)', border:'1px solid var(--border-mid)', borderRadius:12, padding:'12px', minWidth:200, boxShadow:'var(--shadow)' }}>
                    {LABEL_OPTIONS.map(l => (
                      <div key={l.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 4px', cursor:'pointer', borderRadius:6 }} onClick={() => toggleLabel(l.name)}>
                        <div style={{ width:140, height:26, borderRadius:4, background:l.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {labels.includes(l.name) && <Ico d="M20 6 9 17l-5-5" s={12} color="#fff"/>}
                        </div>
                        <span style={{ fontSize:13, color:'var(--text-primary)', fontWeight:500 }}>{l.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {task.due_date && (
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  <div style={sideHead}>Due Date</div>
                  <span style={{ background: new Date(task.due_date)<new Date()?'rgba(248,113,113,0.15)':'rgba(74,222,128,0.15)', border:`1px solid ${new Date(task.due_date)<new Date()?'var(--red)':'var(--green)'}`, color: new Date(task.due_date)<new Date()?'var(--red)':'var(--green)', padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                    {new Date(task.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom:18 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <Ico d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" s={15} color="var(--text-secondary)"/>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'var(--font-display)' }}>Description</span>
              </div>
              {editDesc && canEdit ? (
                <div>
                  <textarea autoFocus rows={4} style={{ width:'100%', background:'var(--bg-input)', border:'1px solid var(--accent)', borderRadius:8, padding:'8px 12px', fontSize:13, color:'var(--text-primary)', resize:'vertical', fontFamily:'var(--font-body)', outline:'none', boxSizing:'border-box' }} value={desc} onChange={e=>setDesc(e.target.value)}/>
                  <div style={{ display:'flex', gap:6, marginTop:6 }}>
                    <button style={{ background:'linear-gradient(135deg,var(--accent),var(--purple))', color:'#080b10', border:'none', borderRadius:7, padding:'6px 16px', fontSize:13, fontWeight:700, cursor:'pointer' }} onClick={saveDesc}>Save</button>
                    <button style={{ background:'none', border:'none', color:'var(--text-secondary)', fontSize:13, cursor:'pointer' }} onClick={()=>{setEditDesc(false);setDesc(task.description||'');}}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ background:'var(--bg-raised)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'var(--text-primary)', minHeight:52, lineHeight:1.6, cursor:canEdit?'pointer':'default' }} onClick={()=>canEdit&&setEditDesc(true)}>
                  {task.description||<span style={{ color:'var(--text-muted)', fontStyle:'italic' }}>Add a more detailed description…</span>}
                </div>
              )}
            </div>

            {/* Checklist */}
            {(checklist.length>0||showCheck) && (
              <div style={{ marginBottom:18 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <Ico d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" s={15} color="var(--text-secondary)"/>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'var(--font-display)' }}>Checklist</span>
                  <span style={{ fontSize:11, color:'var(--text-muted)' }}>{checkPct}%</span>
                  {checklist.length>0 && <button style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:12, cursor:'pointer', marginLeft:'auto' }} onClick={()=>onPatch(task.task_id,{checklist:[]})}>Delete</button>}
                </div>
                {checklist.length>0 && (
                  <div className="xv-progress-bar-wrap" style={{ marginBottom:10 }}>
                    <div className="xv-progress-bar-fill" style={{ width:`${checkPct}%`, background: checkPct===100?'var(--green)':'var(--accent)' }}/>
                  </div>
                )}
                {checklist.map(item => (
                  <div key={item.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0' }}>
                    <input type="checkbox" checked={item.done} onChange={()=>toggleCheck(item.id)} style={{ accentColor:'var(--accent)', width:14, height:14, cursor:'pointer' }}/>
                    <span style={{ flex:1, fontSize:13, color:'var(--text-primary)', textDecoration:item.done?'line-through':'none', opacity:item.done?0.5:1 }}>{item.text}</span>
                    <button style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:13 }} onClick={()=>deleteCheck(item.id)}>✕</button>
                  </div>
                ))}
                {addingCheck ? (
                  <div style={{ marginTop:6 }}>
                    <input autoFocus style={{ width:'100%', background:'var(--bg-input)', border:'1px solid var(--accent)', borderRadius:7, padding:'7px 12px', fontSize:13, color:'var(--text-primary)', fontFamily:'var(--font-body)', outline:'none', boxSizing:'border-box', marginBottom:6 }} placeholder="Add an item…" value={newCheck} onChange={e=>setNewCheck(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addCheckItem();if(e.key==='Escape')setAddingCheck(false);}}/>
                    <div style={{ display:'flex', gap:6 }}>
                      <button style={{ background:'linear-gradient(135deg,var(--accent),var(--purple))', color:'#080b10', border:'none', borderRadius:7, padding:'5px 14px', fontSize:12, fontWeight:700, cursor:'pointer' }} onClick={addCheckItem}>Add</button>
                      <button style={{ background:'none', border:'none', color:'var(--text-secondary)', fontSize:12, cursor:'pointer' }} onClick={()=>setAddingCheck(false)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button style={{ background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-secondary)', fontSize:12, cursor:'pointer', padding:'5px 12px', borderRadius:7, marginTop:4, fontFamily:'var(--font-body)' }} onClick={()=>setAddingCheck(true)}>Add an item</button>
                )}
              </div>
            )}

            {/* Comments */}
            <div style={{ marginBottom:18 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <Ico d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" s={15} color="var(--text-secondary)"/>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'var(--font-display)' }}>Activity</span>
              </div>
              <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:12 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:avatarColor(user.username), display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#080b10', flexShrink:0 }}>{user.username[0].toUpperCase()}</div>
                <div style={{ flex:1 }}>
                  <textarea style={{ width:'100%', background:'var(--bg-input)', border:'1px solid var(--border-mid)', borderRadius:9, padding:'8px 12px', fontSize:13, color:'var(--text-primary)', resize:'none', fontFamily:'var(--font-body)', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }} placeholder="Write a comment…" value={comment} onChange={e=>setComment(e.target.value)} rows={comment?3:1} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();addComment();}}}/>
                  {comment && <button style={{ marginTop:6, background:'linear-gradient(135deg,var(--accent),var(--purple))', color:'#080b10', border:'none', borderRadius:7, padding:'5px 14px', fontSize:12, fontWeight:700, cursor:'pointer' }} onClick={addComment}>Save</button>}
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:avatarColor(task.username), display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#080b10', flexShrink:0 }}>{task.username[0].toUpperCase()}</div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>
                    <b style={{ color:'var(--text-primary)' }}>@{task.username}</b> added this card to <b>{currentCol?.label}</b>
                    <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{fmtTime(task.created_at)}</div>
                  </div>
                </div>
                {[...comments].reverse().map(c => (
                  <div key={c.id} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', background:avatarColor(c.user), display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#080b10', flexShrink:0 }}>{c.user[0].toUpperCase()}</div>
                    <div style={{ fontSize:12, color:'var(--text-secondary)' }}>
                      <b style={{ color:'var(--text-primary)' }}>@{c.user}</b>
                      <div style={{ background:'var(--bg-raised)', border:'1px solid var(--border)', borderRadius:7, padding:'7px 10px', fontSize:13, color:'var(--text-primary)', marginTop:4, lineHeight:1.5 }}>{c.text}</div>
                      <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:3 }}>{fmtTime(c.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ width:160, flexShrink:0, padding:'0 12px', display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <div style={sideHead}>ADD TO CARD</div>
              {[
                { icon:"M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01", label:'Labels', fn:()=>setShowLabels(p=>!p) },
                { icon:"M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11", label:'Checklist', fn:()=>setShowCheck(true) },
                { icon:"M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z", label:'Dates', fn:()=>setShowDate(p=>!p) },
              ].map(b => <button key={b.label} style={{ ...mo, width:'100%', marginBottom:4, justifyContent:'flex-start' }} onClick={b.fn}><Ico d={b.icon} s={13}/>{b.label}</button>)}
            </div>
            <div>
              <div style={sideHead}>ACTIONS</div>
              <div style={{ position:'relative' }}>
                <button style={{ ...mo, width:'100%', marginBottom:4, justifyContent:'flex-start' }} onClick={()=>setShowMove(p=>!p)}><Ico d="M5 12h14M12 5l7 7-7 7" s={13}/>Move</button>
                {showMove && (
                  <div style={{ position:'absolute', zIndex:200, background:'var(--bg-overlay)', border:'1px solid var(--border-mid)', borderRadius:10, padding:'10px', minWidth:160, boxShadow:'var(--shadow)', top:'100%', right:0 }}>
                    {columns.filter(c=>c.id!==task.status).map(col => (
                      <button key={col.id} style={{ display:'block', width:'100%', background:'none', border:'none', color:'var(--text-primary)', fontSize:13, cursor:'pointer', padding:'7px 8px', borderRadius:6, textAlign:'left', fontFamily:'var(--font-body)' }} onClick={()=>{onMove(task.task_id,col.id);setShowMove(false);onClose();}}>{col.label}</button>
                    ))}
                  </div>
                )}
              </div>
              {canEdit && (
                <button style={{ ...mo, width:'100%', color:'var(--red)', border:'1px solid rgba(248,113,113,0.2)', background:'rgba(248,113,113,0.08)', justifyContent:'flex-start' }} onClick={()=>onDelete(task.task_id)}>
                  <Ico d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" s={13} color="var(--red)"/>Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function Ico({ d, s=16, color='currentColor' }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display:'inline-block', verticalAlign:'middle', flexShrink:0 }}>
      <path d={d}/>
    </svg>
  );
}
function TaskIcon({ size=16, color='currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
}
function avatarColor(str) {
  let h=0; for(let i=0;i<(str||'').length;i++) h=str.charCodeAt(i)+((h<<5)-h);
  const c=['#00b8cc','#8b7cf8','#4ade80','#f87171','#fbbf24','#60a5fa'];
  return c[Math.abs(h)%c.length];
}
