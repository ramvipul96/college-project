import { useState, useEffect } from "react";
import { Plus, Clock, Bell, Repeat, Trash2, X } from "lucide-react";
import { remindersAPI } from "../services/api";

const repeatBadge  = { none: "badge-gray", daily: "badge-blue", weekly: "badge-green", monthly: "badge-yellow" };
const statusBadge  = { pending: "badge-yellow", sent: "badge-green", failed: "badge-red", skipped: "badge-gray" };
const emptyForm    = { title: "", description: "", dateTime: "", repeat: "none" };

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [editId, setEditId]       = useState(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const load = () => remindersAPI.getAll().then(d => setReminders(d.data)).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (r) => {
    setForm({ title: r.title, description: r.description || "", dateTime: r.dateTime?.slice(0,16) || "", repeat: r.repeat });
    setEditId(r._id); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.dateTime) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        dateTime:    new Date(form.dateTime).toISOString(),
        scheduledAt: new Date(form.dateTime).toISOString(),
      };
      if (editId) await remindersAPI.update(editId, payload);
      else        await remindersAPI.create(payload);
      closeForm(); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const toggleReminder = async (r) => {
    await remindersAPI.update(r._id, { isActive: !r.isActive }).catch(e => setError(e.message));
    load();
  };

  const deleteReminder = async (id) => {
    if (!confirm("Delete this reminder?")) return;
    await remindersAPI.delete(id).catch(e => setError(e.message));
    load();
  };

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1>Reminders</h1>
          <p>{reminders.filter(r => r.isActive && r.status === "pending").length} pending reminders</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} />Add Reminder</button>
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem" }}>{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", margin: 0 }}>{editId ? "Edit Reminder" : "New Reminder"}</h3>
            <button onClick={closeForm} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}><X size={18} /></button>
          </div>
          <div className="card-body">
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
              <div className="form-group">
                <label className="form-label">Reminder Title *</label>
                <input className="form-input" placeholder="What should we remind you about?" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="Optional details" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
                <div className="form-group">
                  <label className="form-label">Date & Time *</label>
                  <input className="form-input" type="datetime-local" value={form.dateTime} onChange={e => setForm({ ...form, dateTime: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Repeat</label>
                  <select className="form-input" value={form.repeat} onChange={e => setForm({ ...form, repeat: e.target.value })}>
                    {["none","daily","weekly","monthly"].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--color-primary)", background: "var(--color-bg-secondary)", padding: "8px 12px", borderRadius: 6 }}>
                📧 Email will be sent at the exact scheduled time. Failed sends are retried up to 3 times.
              </p>
              <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : editId ? "Update" : "Save Reminder"}</button>
                <button className="btn btn-outline" type="button" onClick={closeForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="section-gap" style={{ gap: "var(--space-sm)" }}>
        {reminders.length === 0 && (
          <div style={{ textAlign: "center", padding: "var(--space-2xl)", color: "var(--color-text-muted)" }}>No reminders yet. Add one!</div>
        )}
        {reminders.map(reminder => (
          <div className="list-item" key={reminder._id} style={{ opacity: reminder.isActive ? 1 : 0.5 }}>
            <div style={{ color: reminder.isActive ? "var(--color-accent)" : "var(--color-text-muted)" }}><Bell size={20} /></div>
            <div className="list-item-content">
              <div className="list-item-title">{reminder.title}</div>
              <div className="list-item-meta">
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} />{new Date(reminder.scheduledAt || reminder.dateTime).toLocaleString()}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Repeat size={12} />{reminder.repeat}</span>
                {reminder.retryCount > 0 && <span style={{ color: "var(--color-danger)", fontSize: "0.75rem" }}>Retry {reminder.retryCount}/3</span>}
              </div>
            </div>
            <span className={`badge ${repeatBadge[reminder.repeat] || "badge-gray"}`}>{reminder.repeat}</span>
            <span className={`badge ${statusBadge[reminder.status] || "badge-gray"}`}>{reminder.status}</span>
            <div className={`toggle ${reminder.isActive ? "active" : ""}`} onClick={() => toggleReminder(reminder)} />
            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(reminder)} title="Edit">✏️</button>
            <button className="btn btn-ghost btn-sm" onClick={() => deleteReminder(reminder._id)}>
              <Trash2 size={14} style={{ color: "var(--color-danger)" }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Reminders;
