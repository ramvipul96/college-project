import { useState, useEffect } from "react";
import { Plus, Check, Calendar, Trash2, X } from "lucide-react";
import { tasksAPI } from "../services/api";

const filters      = ["All", "Active", "Completed", "high", "medium", "low"];
const priorityBadge = { high: "badge-red", medium: "badge-yellow", low: "badge-blue" };
const emptyForm     = { title: "", description: "", priority: "medium", status: "pending", dueDate: "" };

const Tasks = () => {
  const [tasks, setTasks]       = useState([]);
  const [filter, setFilter]     = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [editId, setEditId]     = useState(null);
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const load = () => {
    setLoading(true);
    tasksAPI.getAll()
      .then(d => setTasks(d.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (t) => {
    setForm({ title: t.title, description: t.description || "", priority: t.priority, status: t.status, dueDate: t.dueDate ? t.dueDate.slice(0, 16) : "" });
    setEditId(t._id); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editId) await tasksAPI.update(editId, form);
      else        await tasksAPI.create(form);
      closeForm(); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const toggleTask = async (task) => {
    const next = task.status === "completed" ? "pending" : "completed";
    await tasksAPI.update(task._id, { status: next }).catch(e => setError(e.message));
    load();
  };

  const deleteTask = async (id) => {
    if (!confirm("Delete this task?")) return;
    await tasksAPI.delete(id).catch(e => setError(e.message));
    load();
  };

  const filtered = tasks.filter((t) => {
    if (filter === "Active")    return t.status !== "completed";
    if (filter === "Completed") return t.status === "completed";
    if (["high","medium","low"].includes(filter)) return t.priority === filter;
    return true;
  });

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p>{tasks.filter(t => t.status !== "completed").length} tasks remaining</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} />Add Task</button>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {/* Inline Add/Edit Form */}
      {showForm && (
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", margin: 0 }}>
              {editId ? "Edit Task" : "New Task"}
            </h3>
            <button onClick={closeForm} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
              <X size={18} />
            </button>
          </div>
          <div className="card-body">
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="Task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="Optional details" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-md)" }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    {["low","medium","high"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {["pending","in-progress","completed"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="datetime-local" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? "Saving..." : editId ? "Update Task" : "Save Task"}
                </button>
                <button className="btn btn-outline" type="button" onClick={closeForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="filter-bar">
        {filters.map(f => (
          <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="section-gap" style={{ gap: "var(--space-sm)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "var(--space-2xl)", color: "var(--color-text-muted)" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--space-2xl)", color: "var(--color-text-muted)" }}>No tasks found</div>
        ) : filtered.map(task => (
          <div className={`list-item ${task.status === "completed" ? "completed" : ""}`} key={task._id}>
            <div className={`checkbox ${task.status === "completed" ? "checked" : ""}`} onClick={() => toggleTask(task)}>
              {task.status === "completed" && <Check size={12} />}
            </div>
            <div className="list-item-content">
              <div className={`list-item-title ${task.status === "completed" ? "done" : ""}`}>{task.title}</div>
              <div className="list-item-meta">
                {task.dueDate && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} />{new Date(task.dueDate).toLocaleDateString()}</span>}
                {task.description && <span style={{ color: "var(--color-text-muted)" }}>{task.description}</span>}
              </div>
            </div>
            <span className={`badge ${priorityBadge[task.priority] || "badge-blue"}`}>{task.priority}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(task)} title="Edit">✏️</button>
            <button className="btn btn-ghost btn-sm" onClick={() => deleteTask(task._id)} title="Delete">
              <Trash2 size={14} style={{ color: "var(--color-danger)" }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Tasks;
