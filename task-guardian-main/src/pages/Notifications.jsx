import { useEffect, useState } from 'react';
import { notificationsAPI } from '../services/api';

const typeStyle = {
  info:    { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: 'ℹ️',  text: 'text-blue-800'   },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '⚠️', text: 'text-yellow-800' },
  success: { bg: 'bg-green-50',  border: 'border-green-200',  icon: '✅',  text: 'text-green-800'  },
  error:   { bg: 'bg-red-50',    border: 'border-red-200',    icon: '❌',  text: 'text-red-800'    },
};
const empty = { title: '', message: '', type: 'info' };

const Notifications = () => {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => { setLoading(true); notificationsAPI.getAll().then(d => setNotifs(d.data)).catch(e => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await notificationsAPI.create(form); setShowForm(false); setForm(empty); load(); }
    catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const markRead = async (id) => { await notificationsAPI.markRead(id).catch(e => setError(e.message)); load(); };
  const handleDelete = async (id) => { if (!confirm('Delete?')) return; await notificationsAPI.delete(id).catch(e => setError(e.message)); load(); };
  const markAllRead = async () => { await Promise.all(notifs.filter(n => !n.isRead).map(n => notificationsAPI.markRead(n._id))); load(); };
  const unreadCount = notifs.filter(n => !n.isRead).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-800">Notifications</h1><p className="text-gray-500 text-sm mt-1">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p></div>
        <div className="flex gap-2">
          {unreadCount > 0 && <button onClick={markAllRead} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Mark all read</button>}
          <button onClick={() => { setShowForm(true); setForm(empty); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">+ Add Notification</button>
        </div>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      {loading ? <div className="space-y-3">{Array(3).fill(0).map((_,i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-gray-100"/>)}</div>
       : notifs.length === 0 ? <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">🔔</div><p>No notifications yet.</p></div>
       : <div className="space-y-3">{notifs.map(n => { const s = typeStyle[n.type]||typeStyle.info; return (
          <div key={n._id} className={`rounded-xl border p-5 transition ${s.bg} ${s.border} ${n.isRead ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-xl mt-0.5">{s.icon}</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-semibold ${s.text}`}>{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 bg-indigo-600 rounded-full inline-block"/>}
                    {n.emailSent && <span className="text-xs bg-white border border-green-200 text-green-700 px-2 py-0.5 rounded-full">📧 Emailed</span>}
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {!n.isRead && <button onClick={() => markRead(n._id)} className="text-xs text-indigo-600 hover:underline">Mark read</button>}
                <button onClick={() => handleDelete(n._id)} className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ); })}</div>}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">New Notification</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input required value={form.title} onChange={set('title')} placeholder="Notification title" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Message *</label><textarea required value={form.message} onChange={set('message')} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={form.type} onChange={set('type')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">{['info','warning','success','error'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
              <p className="text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">📧 An email will be sent immediately!</p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">{saving ? 'Sending...' : 'Create & Send Email'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Notifications;
