import { useState } from "react";
import { Plus, Check, Calendar } from "lucide-react";

const initialTasks = [
  { id: 1, title: "Call mom", priority: "High", due: "Today", done: false },
  { id: 2, title: "Submit project report", priority: "High", due: "Tomorrow", done: false },
  { id: 3, title: "Buy groceries", priority: "Medium", due: "Today", done: false },
  { id: 4, title: "Schedule dentist appointment", priority: "Low", due: "This week", done: true },
  { id: 5, title: "Review study notes", priority: "Medium", due: "Tomorrow", done: false },
  { id: 6, title: "Pay electricity bill", priority: "High", due: "Today", done: true },
];

const filters = ["All", "Active", "Completed", "High", "Medium", "Low"];
const priorityBadge = { High: "badge-red", Medium: "badge-yellow", Low: "badge-blue" };

const Tasks = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState("All");
  const [newTask, setNewTask] = useState("");

  const toggleTask = (id) => setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now(), title: newTask, priority: "Medium", due: "Today", done: false }]);
    setNewTask("");
  };

  const filtered = tasks.filter((t) => {
    if (filter === "Active") return !t.done;
    if (filter === "Completed") return t.done;
    if (["High", "Medium", "Low"].includes(filter)) return t.priority === filter;
    return true;
  });

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p>{tasks.filter((t) => !t.done).length} tasks remaining</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "var(--space-sm)" }}>
        <input className="form-input" placeholder="Add a new task..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={addTask}><Plus size={16} />Add</button>
      </div>

      <div className="filter-bar">
        {filters.map((f) => (
          <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="section-gap" style={{ gap: "var(--space-sm)" }}>
        {filtered.map((task) => (
          <div className={`list-item ${task.done ? "completed" : ""}`} key={task.id}>
            <div className={`checkbox ${task.done ? "checked" : ""}`} onClick={() => toggleTask(task.id)}>
              {task.done && <Check size={12} />}
            </div>
            <div className="list-item-content">
              <div className={`list-item-title ${task.done ? "done" : ""}`}>{task.title}</div>
              <div className="list-item-meta">
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> {task.due}</span>
              </div>
            </div>
            <span className={`badge ${priorityBadge[task.priority]}`}>{task.priority}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "var(--space-2xl)", color: "var(--color-text-muted)" }}>No tasks found</div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
