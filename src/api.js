const API_URL = process.env.REACT_APP_API_URL ||
  'https://script.google.com/macros/s/AKfycbzPfKCh_kBXY817uQAeOgFP1qVTejxezJa3aSMGZPHIvvJY18fOuWN5KyzF6WuXR6g/exec';

async function get(action, params = {}) {
  const qs = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${API_URL}?${qs}`);
  return res.json();
}

async function post(action, data) {
  await fetch(API_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...data }),
  });
  return { success: true };
}

async function postReadable(action, data) {
  const qs = new URLSearchParams({ action, ...data }).toString();
  const res = await fetch(`${API_URL}?${qs}`);
  return res.json();
}

export const api = {
  login: (user_id, password_hash) =>
    postReadable('login', { user_id, password_hash }),
  logAttendance: (data) => post('log_attendance', data),
  saveSession:   (data) => post('save_session', data),
  sendMessage:   (data) => post('send_message', data),
  createTask:    (data) => post('create_task', data),
  updateTask:    (data) => post('update_task', data),
  createUser:    (data) => post('create_user', data),
  getMessages:   (since) => get('get_messages', since ? { since } : {}),
  getTasks:      (user_id, role) => get('get_tasks', { user_id, role }),
  getUsers:      () => get('get_users'),
};
