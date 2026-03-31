import { useEffect, useState } from 'react';
import { contactsAPI } from '../services/api';

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const empty = { name: '', phone: '', email: '', relationship: '', birthdayMonth: '', birthdayDay: '' };

const EmergencyContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => { setLoading(true); contactsAPI.getAll().then(d => setContacts(d.data)).catch(e => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm(empty); setEditId(null); setShowForm(true); };
  const openEdit = (c) => { setForm({ name: c.name, phone: c.phone||'', email: c.email||'', relationship: c.relationship||'', birthdayMonth: c.birthdayMonth||'', birthdayDay: c.birthdayDay||'' }); setEditId(c._id); setShowForm(true); };
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const p = { ...form, birthdayMonth: form.birthdayMonth ? Number(form.birthdayMonth) : undefined, birthdayDay: form.birthdayDay ? Number(form.birthdayDay) : undefined };
      if (editId) await contactsAPI.update(editId, p); else await contactsAPI.create(p);
      setShowForm(false); load();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const handleDelete = async (id) => { if (!confirm('Delete?')) return; await contactsAPI.delete(id).catch(e => setError(e.message)); load(); };
  const isBirthdayToday = c => { if (!c.birthdayMonth || !c.birthdayDay) return false; const n = new Date(); return c.birthdayMonth === n.getMonth()+1 && c.birthdayDay === n.getDate(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-800">Emergency Contacts</h1><p className="text-gray-500 text-sm mt-1">Birthday wishes sent automatically at 8 AM</p></div>
        <button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">+ Add Contact</button>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array(3).fill(0).map((_,i) => <div key={i} className="h-40 bg-white rounded-xl animate-pulse border border-gray-100"/>)}</div>
       : contacts.length === 0 ? <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">📞</div><p>No contacts yet!</p></div>
       : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{contacts.map(c => (
          <div key={c._id} className={`bg-white rounded-xl border shadow-sm p-5 ${isBirthdayToday(c) ? 'border-purple-300 ring-2 ring-purple-100' : 'border-gray-100'}`}>
            {isBirthdayToday(c) && <div className="bg-purple-50 text-purple-700 text-xs font-medium px-3 py-1 rounded-full mb-3 inline-block">🎂 Birthday Today!</div>}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">{c.name[0].toUpperCase()}</div>
              <div><p className="font-semibold text-gray-800">{c.name}</p>{c.relationship && <p className="text-xs text-gray-500">{c.relationship}</p>}</div>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              {c.phone && <p>📞 {c.phone}</p>}
              {c.email && <p>📧 {c.email}</p>}
              {c.birthdayMonth && c.birthdayDay && <p>🎂 {months[c.birthdayMonth-1]} {c.birthdayDay}</p>}
            </div>
            <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
              <button onClick={() => openEdit(c)} className="text-sm text-blue-600 hover:underline">Edit</button>
              <button onClick={() => handleDelete(c._id)} className="text-sm text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}</div>}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-5">{editId ? 'Edit Contact' : 'New Contact'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input required value={form.name} onChange={set('name')} placeholder="John Doe" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={set('email')} placeholder="contact@email.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label><input value={form.relationship} onChange={set('relationship')} placeholder="Friend, Parent, Doctor" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">🎂 Birthday (optional)</label>
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.birthdayMonth} onChange={set('birthdayMonth')} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Month</option>{months.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select>
                  <input type="number" min="1" max="31" value={form.birthdayDay} onChange={set('birthdayDay')} placeholder="Day" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                </div>
              </div>
              <p className="text-xs text-purple-700 bg-purple-50 px-3 py-2 rounded-lg">🎂 Guardian will email you a birthday reminder every year at 8 AM!</p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">{saving ? 'Saving...' : editId ? 'Update' : 'Add Contact'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default EmergencyContacts;
