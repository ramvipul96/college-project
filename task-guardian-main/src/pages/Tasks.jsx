import { useEffect, useState } from 'react';
import { tasksAPI } from '../services/api';

const priorityColor = { low: 'text-green-600 bg-green-50', medium: 'text-yellow-600 bg-yellow-50', high: 'text-red-600 bg-red-50' };
const statusColor   = { pending: 'text-gray-600 bg-gray-100', 'in-progress': 'text-blue-600 bg-blue-50', completed: 'text-green-700 bg-green-50' };
const empty = { title: '', description: '', priority: 'medium', status: 'pending', dueDate: '' };

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const load = () => { setLoading(true); tasksAPI.getAll().then(d => setTasks(d.data)).catch(e => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm(empty); setEditId(null); setShowForm(true); };
  const openEdit = (t) => { setForm({ title: t.title, description: t.description, priority: t.priority, status: t.status, dueDate: t.dueDate ? t.dueDate.slice(0,16) : '' }); setEditId(t._id); setShowForm(true); };
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { if (editId) await tasksAPI.update(editId, form); else await tasksAPI.create(form); setShowForm(false); load(); }
    catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const handleDelete = async (id) => { if (!confirm('Delete?')) return; await tasksAPI.delete(id).catch(e => setError(e.message)); load(); };
  const toggleStatus = async (t) => { await tasksAPI.update(t._id, { status: t.status === 'completed' ? 'pending' : 'completed' }).catch(e => setError(e.message)); load(); };
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-800">Tasks</h1><p className="text-gray-500 text-sm mt-1">{tasks.length} total tasks</p></div>
        <button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">+ Add Task</button>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      <div className="flex gap-2 mb-6">
        {['all','pending','in-progress','completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition ${filter===f ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{f}</button>
        ))}
      </div>
      {loading ? <div className="space-y-3">{Array(3).fill(0).map((_,i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-gray-100"/>)}</div>
       : filtered.length === 0 ? <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">✅</div><p>No tasks found. Add one!</p></div>
       : <div className="space-y-3">{filtered.map(t => (
          <div key={t._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
            <input type="checkbox" checked={t.status==='completed'} onChange={() => toggleStatus(t)} className="mt-1 w-4 h-4 accent-indigo-600 cursor-pointer"/>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`font-medium text-gray-800 ${t.status==='completed' ? 'line-through text-gray-400' : ''}`}>{t.title}</p>
                <div className="flex gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${priorityColor[t.priority]}`}>{t.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor[t.status]}`}>{t.status}</span>
                </div>
              </div>
              {t.description && <p className="text-sm text-gray-500 mt-1">{t.description}</p>}
              {t.dueDate && <p className="text-xs text-gray-400 mt-1">📅 Due: {new Date(t.dueDate).toLocaleString()}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => openEdit(t)} className="text-sm text-blue-600 hover:underline">Edit</button>
              <button onClick={() => handleDelete(t._id)} className="text-sm text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}</div>}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">{editId ? 'Edit Task' : 'New Task'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input required value={form.title} onChange={set('title')} placeholder="Task title" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={set('description')} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label><select value={form.priority} onChange={set('priority')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">{['low','medium','high'].map(p=><option key={p} value={p}>{p}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={form.status} onChange={set('status')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">{['pending','in-progress','completed'].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date & Time</label><input type="datetime-local" value={form.dueDate} onChange={set('dueDate')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <p className="text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">📧 You'll get an email 1 hour before the due date!</p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">{saving ? 'Saving...' : editId ? 'Update' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Tasks;
