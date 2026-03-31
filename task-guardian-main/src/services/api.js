const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('guardian_token');
const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});
const request = async (method, path, body) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method, headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};
const get = (p) => request('GET', p);
const post = (p, b) => request('POST', p, b);
const put = (p, b) => request('PUT', p, b);
const del = (p) => request('DELETE', p);

export const authAPI = {
  login: (email, password) => post('/auth/login', { email, password }),
  register: (name, email, password) => post('/auth/register', { name, email, password }),
  me: () => get('/auth/me'),
};
export const dashboardAPI = { getStats: () => get('/dashboard') };
export const tasksAPI = {
  getAll: () => get('/tasks'),
  create: (t) => post('/tasks', t),
  update: (id, t) => put(`/tasks/${id}`, t),
  delete: (id) => del(`/tasks/${id}`),
};
export const remindersAPI = {
  getAll: () => get('/reminders'),
  create: (r) => post('/reminders', r),
  update: (id, r) => put(`/reminders/${id}`, r),
  delete: (id) => del(`/reminders/${id}`),
};
export const notificationsAPI = {
  getAll: () => get('/notifications'),
  create: (n) => post('/notifications', n),
  markRead: (id) => put(`/notifications/${id}/read`),
  delete: (id) => del(`/notifications/${id}`),
};
export const contactsAPI = {
  getAll: () => get('/contacts'),
  create: (c) => post('/contacts', c),
  update: (id, c) => put(`/contacts/${id}`, c),
  delete: (id) => del(`/contacts/${id}`),
};
export const adminAPI = {
  getUsers: () => get('/admin/users'),
  toggleUser: (id) => put(`/admin/users/${id}/toggle`),
  getStats: () => get('/admin/stats'),
};
export const saveToken = (t) => localStorage.setItem('guardian_token', t);
export const clearToken = () => localStorage.removeItem('guardian_token');
export const isLoggedIn = () => !!getToken();
