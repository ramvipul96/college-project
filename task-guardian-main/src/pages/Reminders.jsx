import { useEffect, useState } from 'react';
import { remindersAPI } from '../services/api';

const empty = { title: '', description: '', dateTime: '', repeat: 'none' };

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => { setLoading(true); remindersAPI.getAll().then(d => setReminders(d.data)).catch(e => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm(empty); setEditId(null); setShowForm(true); };
  const openEdit = (r) => { setForm({ title: r.title, description: r.description, dateTime: r.dateTime?.slice(0,16)||'', repeat: r.repeat }); setEditId(r._id); setShowForm(true); };
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { if (editId) await remindersAPI.update(editId, form); else await remindersAPI.create(form); setShowForm(false); load(); }
    catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const handleDelete = async (id) => { if (!confirm('Delete?')) return; await remindersAPI.delete(id).catch(e => setError(e.message)); load(); };
  const isPast = dt => new Date(dt) < new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-800">Reminders</h1><p className="text-gray-500 text-sm mt-1">Email reminders sent at scheduled time</p></div>
        <button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">+ Add Reminder</button>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      {loading ? <div className="space-y-3">{Array(3).fill(0).map((_,i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-gray-100"/>)}</div>
       : reminders.length === 0 ? <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">⏰</div><p>No reminders yet!</p></div>
       : <div className="space-y-3">{reminders.map(r => (
          <div key={r._id} className={`bg-white rounded-xl border shadow-sm p-5 ${isPast(r.dateTime) ? 'border-gray-100 opacity-70' : 'border-indigo-100'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-800">{r.title}</p>
                  {r.emailSent && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">✅ Email sent</span>}
                  {r.repeat !== 'none' && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize">🔁 {r.repeat}</span>}
                </div>
                {r.description && <p className="text-sm text-gray-500 mt-1">{r.description}</p>}
                <p className="text-xs text-gray-400 mt-2">📅 {new Date(r.dateTime).toLocaleString()}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(r)} className="text-sm text-blue-600 hover:underline">Edit</button>
                <button onClick={() => handleDelete(r._id)} className="text-sm text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}</div>}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">{editId ? 'Edit Reminder' : 'New Reminder'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input required value={form.title} onChange={set('title')} placeholder="Reminder title" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={set('description')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label><input required type="datetime-local" value={form.dateTime} onChange={set('dateTime')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Repeat</label><select value={form.repeat} onChange={set('repeat')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">{['none','daily','weekly','monthly'].map(r=><option key={r} value={r}>{r}</option>)}</select></div>
              <p className="text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">📧 An email will be sent at exactly the scheduled time!</p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">{saving ? 'Saving...' : editId ? 'Update' : 'Create Reminder'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Reminders;
