import { useState, useEffect } from "react";
import { Plus, Clock, Bell, Repeat, Trash2 } from "lucide-react";
import { remindersAPI } from "../services/api";

const repeatBadge = { none: "badge-gray", daily: "badge-blue", weekly: "badge-green", monthly: "badge-yellow" };

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newRepeat, setNewRepeat] = useState("none");
  const [error, setError] = useState("");

  const load = () => {
    remindersAPI.getAll()
      .then(d => setReminders(d.data))
      .catch(e => setError(e.message));
  };

  useEffect(() => { load(); }, []);

  const toggleReminder = async (reminder) => {
    await remindersAPI.update(reminder._id, { isActive: !reminder.isActive }).catch(e => setError(e.message));
    load();
  };

  const addReminder = async () => {
    if (!newTitle.trim()) return;
    await remindersAPI.create({
      title: newTitle,
      dateTime: newTime ? new Date(newTime).toISOString() : new Date(Date.now() + 3600000).toISOString(),
      repeat: newRepeat,
    }).catch(e => setError(e.message));
    setNewTitle(""); setNewTime(""); setNewRepeat("none"); setShowForm(false);
    load();
  };

  const deleteReminder = async (id) => {
    await remindersAPI.delete(id).catch(e => setError(e.message));
    load();
  };

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1>Reminders</h1>
          <p>{reminders.filter((r) => r.isActive).length} active reminders</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={16} />Add Reminder</button>
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem" }}>{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <div className="form-group">
              <label className="form-label">Reminder Title</label>
              <input className="form-input" placeholder="What should we remind you about?" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Date & Time</label>
              <input className="form-input" type="datetime-local" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Repeat</label>
              <select className="form-input" value={newRepeat} onChange={(e) => setNewRepeat(e.target.value)}>
                {["none", "daily", "weekly", "monthly"].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: "var(--space-sm)" }}>
              <button className="btn btn-primary" onClick={addReminder}>Save Reminder</button>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="section-gap" style={{ gap: "var(--space-sm)" }}>
        {reminders.map((reminder) => (
          <div className="list-item" key={reminder._id} style={{ opacity: reminder.isActive ? 1 : 0.5 }}>
            <div style={{ color: reminder.isActive ? "var(--color-accent)" : "var(--color-text-muted)" }}><Bell size={20} /></div>
            <div className="list-item-content">
              <div className="list-item-title">{reminder.title}</div>
              <div className="list-item-meta">
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} />{new Date(reminder.dateTime).toLocaleString()}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Repeat size={12} />{reminder.repeat}</span>
                {reminder.emailSent && <span style={{ color: "var(--color-success)", fontSize: "0.75rem" }}>✅ Email sent</span>}
              </div>
            </div>
            <span className={`badge ${repeatBadge[reminder.repeat] || "badge-gray"}`}>{reminder.repeat}</span>
            <div className={`toggle ${reminder.isActive ? "active" : ""}`} onClick={() => toggleReminder(reminder)} />
            <button className="btn btn-ghost btn-sm" onClick={() => deleteReminder(reminder._id)}>
              <Trash2 size={14} style={{ color: "var(--color-danger)" }} />
            </button>
          </div>
        ))}
        {reminders.length === 0 && (
          <div style={{ textAlign: "center", padding: "var(--space-2xl)", color: "var(--color-text-muted)" }}>No reminders yet. Add one!</div>
        )}
      </div>
    </div>
  );
};

export default Reminders;
