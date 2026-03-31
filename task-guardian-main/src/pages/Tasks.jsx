import { useState, useEffect } from "react";
import { Plus, Check, Calendar, Trash2 } from "lucide-react";
import { tasksAPI } from "../services/api";

const filters = ["All", "Active", "Completed", "high", "medium", "low"];
const priorityBadge = { high: "badge-red", medium: "badge-yellow", low: "badge-blue" };

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("All");
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    tasksAPI.getAll()
      .then(d => setTasks(d.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleTask = async (task) => {
    const next = task.status === "completed" ? "pending" : "completed";
    await tasksAPI.update(task._id, { status: next }).catch(e => setError(e.message));
    load();
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    await tasksAPI.create({ title: newTask, priority: "medium", status: "pending" }).catch(e => setError(e.message));
    setNewTask("");
    load();
  };

  const deleteTask = async (id) => {
    await tasksAPI.delete(id).catch(e => setError(e.message));
    load();
  };

  const filtered = tasks.filter((t) => {
    if (filter === "Active") return t.status !== "completed";
    if (filter === "Completed") return t.status === "completed";
    if (["high", "medium", "low"].includes(filter)) return t.priority === filter;
    return true;
  });

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p>{tasks.filter((t) => t.status !== "completed").length} tasks remaining</p>
        </div>
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem" }}>{error}</div>}

      <div style={{ display: "flex", gap: "var(--space-sm)" }}>
        <input
          className="form-input"
          placeholder="Add a new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          style={{ flex: 1 }}
        />
        <button className="btn btn-primary" onClick={addTask}><Plus size={16} />Add</button>
      </div>

      <div className="filter-bar">
        {filters.map((f) => (
          <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="section-gap" style={{ gap: "var(--space-sm)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "var(--space-2xl)", color: "var(--color-text-muted)" }}>Loading...</div>
        ) : filtered.map((task) => (
          <div className={`list-item ${task.status === "completed" ? "completed" : ""}`} key={task._id}>
            <div className={`checkbox ${task.status === "completed" ? "checked" : ""}`} onClick={() => toggleTask(task)}>
              {task.status === "completed" && <Check size={12} />}
            </div>
            <div className="list-item-content">
              <div className={`list-item-title ${task.status === "completed" ? "done" : ""}`}>{task.title}</div>
              <div className="list-item-meta">
                {task.dueDate && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} />{new Date(task.dueDate).toLocaleDateString()}</span>}
              </div>
            </div>
            <span className={`badge ${priorityBadge[task.priority] || "badge-blue"}`}>{task.priority}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => deleteTask(task._id)} title="Delete">
              <Trash2 size={14} style={{ color: "var(--color-danger)" }} />
            </button>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "var(--space-2xl)", color: "var(--color-text-muted)" }}>No tasks found</div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
