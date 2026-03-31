import { useState } from "react";
import { Plus, Clock, Bell, Repeat } from "lucide-react";

const initialReminders = [
  { id: 1, title: "Take morning medication", time: "9:00 AM", repeat: "Daily", active: true },
  { id: 2, title: "Call parents", time: "6:00 PM", repeat: "Weekly", active: true },
  { id: 3, title: "Drink water", time: "Every 2 hours", repeat: "Daily", active: true },
  { id: 4, title: "Submit assignment", time: "Mar 25, 5:00 PM", repeat: "Once", active: false },
  { id: 5, title: "Birthday wish - Rahul", time: "Apr 2, 12:00 AM", repeat: "Yearly", active: true },
  { id: 6, title: "Pay rent", time: "1st of month", repeat: "Monthly", active: true },
];

const repeatBadge = { Daily: "badge-blue", Weekly: "badge-green", Monthly: "badge-yellow", Yearly: "badge-red", Once: "badge-gray" };

const Reminders = () => {
  const [reminders, setReminders] = useState(initialReminders);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");

  const toggleReminder = (id) => setReminders(reminders.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));

  const addReminder = () => {
    if (!newTitle.trim()) return;
    setReminders([...reminders, { id: Date.now(), title: newTitle, time: newTime || "Not set", repeat: "Once", active: true }]);
    setNewTitle(""); setNewTime(""); setShowForm(false);
  };

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1>Reminders</h1>
          <p>{reminders.filter((r) => r.active).length} active reminders</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={16} />Add Reminder</button>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <div className="form-group">
              <label className="form-label">Reminder Title</label>
              <input className="form-input" placeholder="What should we remind you about?" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Time</label>
              <input className="form-input" placeholder="e.g., 9:00 AM, Tomorrow 3 PM" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
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
          <div className="list-item" key={reminder.id} style={{ opacity: reminder.active ? 1 : 0.5 }}>
            <div style={{ color: reminder.active ? "var(--color-accent)" : "var(--color-text-muted)" }}><Bell size={20} /></div>
            <div className="list-item-content">
              <div className="list-item-title">{reminder.title}</div>
              <div className="list-item-meta">
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {reminder.time}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Repeat size={12} /> {reminder.repeat}</span>
              </div>
            </div>
            <span className={`badge ${repeatBadge[reminder.repeat]}`}>{reminder.repeat}</span>
            <div className={`toggle ${reminder.active ? "active" : ""}`} onClick={() => toggleReminder(reminder.id)} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reminders;
