#!/bin/bash
set -e
echo "🛡️  Guardian FE Fix — Restoring original design + wiring real API"
echo "=================================================================="

cd "$(dirname "$0")"

mkdir -p task-guardian-main/src/context
mkdir -p task-guardian-main/src/services
mkdir -p task-guardian-main/src/pages/admin

# ── .env ─────────────────────────────────────────────────────────
cat > task-guardian-main/.env << 'EOF'
VITE_API_URL=http://localhost:5000/api
EOF

# ── src/services/api.js ───────────────────────────────────────────
cat > task-guardian-main/src/services/api.js << 'EOF'
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('guardian_token');
const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});
const request = async (method, path, body) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method, headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};
const get = (p) => request('GET', p);
const post = (p, b) => request('POST', p, b);
const put = (p, b) => request('PUT', p, b);
const del = (p) => request('DELETE', p);

export const authAPI = {
  login: (email, password) => post('/auth/login', { email, password }),
  register: (name, email, password) => post('/auth/register', { name, email, password }),
  me: () => get('/auth/me'),
};
export const dashboardAPI = { getStats: () => get('/dashboard') };
export const tasksAPI = {
  getAll: () => get('/tasks'),
  create: (t) => post('/tasks', t),
  update: (id, t) => put(`/tasks/${id}`, t),
  delete: (id) => del(`/tasks/${id}`),
};
export const remindersAPI = {
  getAll: () => get('/reminders'),
  create: (r) => post('/reminders', r),
  update: (id, r) => put(`/reminders/${id}`, r),
  delete: (id) => del(`/reminders/${id}`),
};
export const notificationsAPI = {
  getAll: () => get('/notifications'),
  create: (n) => post('/notifications', n),
  markRead: (id) => put(`/notifications/${id}/read`),
  delete: (id) => del(`/notifications/${id}`),
};
export const contactsAPI = {
  getAll: () => get('/contacts'),
  create: (c) => post('/contacts', c),
  update: (id, c) => put(`/contacts/${id}`, c),
  delete: (id) => del(`/contacts/${id}`),
};
export const adminAPI = {
  getUsers: () => get('/admin/users'),
  toggleUser: (id) => put(`/admin/users/${id}/toggle`),
  getStats: () => get('/admin/stats'),
};
export const saveToken = (t) => localStorage.setItem('guardian_token', t);
export const clearToken = () => localStorage.removeItem('guardian_token');
export const isLoggedIn = () => !!getToken();
EOF

# ── src/context/AuthContext.jsx ───────────────────────────────────
cat > task-guardian-main/src/context/AuthContext.jsx << 'EOF'
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, saveToken, clearToken, isLoggedIn } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn()) {
      authAPI.me()
        .then(d => setUser(d.user))
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    saveToken(data.token);
    setUser(data.user);
    return data.user;
  };
  const register = async (name, email, password) => {
    const data = await authAPI.register(name, email, password);
    saveToken(data.token);
    setUser(data.user);
    return data.user;
  };
  const logout = () => { clearToken(); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
EOF

# ── src/main.jsx ──────────────────────────────────────────────────
cat > task-guardian-main/src/main.jsx << 'EOF'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
EOF

# ── src/pages/Login.jsx — ORIGINAL DESIGN + real API ─────────────
cat > task-guardian-main/src/pages/Login.jsx << 'EOF'
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Mail, Lock, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = tab === "login"
        ? await login(form.email, form.password)
        : await register(form.name, form.email, form.password);
      navigate(user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="icon"><Shield size={28} /></div>
          <h1>Guardian</h1>
          <p>Personal Alert & Reminder System</p>
        </div>
        <div className="login-tabs">
          <button className={`login-tab ${tab === "login" ? "active" : ""}`} onClick={() => { setTab("login"); setError(""); }}>Sign In</button>
          <button className={`login-tab ${tab === "register" ? "active" : ""}`} onClick={() => { setTab("register"); setError(""); }}>Register</button>
        </div>
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem", marginBottom: "var(--space-md)" }}>
            {error}
          </div>
        )}
        <form className="login-form" onSubmit={handleSubmit}>
          {tab === "register" && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: "relative" }}>
                <User size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Your full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input className="form-input" style={{ paddingLeft: 36 }} type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input className="form-input" style={{ paddingLeft: 36 }} type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: "100%", marginTop: "var(--space-sm)", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
        <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "var(--space-lg)" }}>
          {tab === "login" ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: "var(--color-primary)", cursor: "pointer", fontWeight: 500 }} onClick={() => { setTab(tab === "login" ? "register" : "login"); setError(""); }}>
            {tab === "login" ? "Register" : "Sign In"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
EOF

# ── src/components/AppLayout.jsx — ORIGINAL DESIGN + auth guard ──
cat > task-guardian-main/src/components/AppLayout.jsx << 'EOF'
import { useState } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import {
  LayoutDashboard, Bell, CheckSquare, Clock,
  Users, AlertTriangle, Menu, X, Shield, LogOut, Settings,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/tasks", label: "Tasks", icon: CheckSquare },
  { path: "/reminders", label: "Reminders", icon: Clock },
  { path: "/notifications", label: "Notifications", icon: Bell },
  { path: "/emergency-contacts", label: "Emergency Contacts", icon: Users },
];

const AppLayout = ({ children }) => {
  const location = useLocation();
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "var(--color-text-muted)" }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-wrapper">
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon primary"><Shield size={20} /></div>
          <div>
            <h1>Guardian</h1>
            <p>Alert & Reminder System</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`sidebar-link ${isActive ? "active" : ""}`}>
                <item.icon />{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          {user.role === "admin" && (
            <Link to="/admin" className="sidebar-link"><Settings />Admin Panel</Link>
          )}
          <button className="sidebar-link" onClick={logout} style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}>
            <LogOut />Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div>
          <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
          <aside className="mobile-sidebar">
            <div className="mobile-sidebar-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Shield size={20} style={{ color: "var(--color-primary)" }} />
                <span style={{ fontWeight: 700, fontFamily: "var(--font-display)" }}>Guardian</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} style={{ color: "var(--color-text-muted)" }}><X size={20} /></button>
            </div>
            <nav className="sidebar-nav">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={`sidebar-link ${isActive ? "active" : ""}`}>
                    <item.icon />{item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        <header className="mobile-header">
          <button onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="mobile-header-brand">
            <Shield size={20} style={{ color: "var(--color-primary)" }} />Guardian
          </div>
          <div style={{ width: 20 }} />
        </header>
        <main className="main-inner">{children}</main>
        <button className="floating-alert-btn" onClick={() => alert("🚨 Personal Alert Triggered! Emergency contacts will be notified.")} title="Personal Alert">
          <AlertTriangle />
        </button>
        <nav className="mobile-bottom-nav">
          {navItems.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`mobile-nav-link ${isActive ? "active" : ""}`}>
                <item.icon />{item.label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AppLayout;
EOF

# ── src/pages/Dashboard.jsx — ORIGINAL DESIGN + real API ─────────
cat > task-guardian-main/src/pages/Dashboard.jsx << 'EOF'
import { useEffect, useState } from "react";
import { Shield, CheckSquare, Clock, AlertTriangle, Activity } from "lucide-react";
import { dashboardAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity] = useState([
    { text: "Checked in successfully", time: "2 min ago", color: "green" },
    { text: "Task completed", time: "1 hour ago", color: "blue" },
    { text: "Reminder triggered", time: "Yesterday", color: "yellow" },
    { text: "Emergency contact updated", time: "2 days ago", color: "blue" },
  ]);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(d => setStats(d.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Tasks Completed", value: stats?.completedTasks ?? "—", icon: CheckSquare, color: "green" },
    { label: "Active Reminders", value: stats?.activeReminders ?? "—", icon: Clock, color: "blue" },
    { label: "Unread Alerts", value: stats?.unreadNotifications ?? "—", icon: AlertTriangle, color: "red" },
    { label: "Emergency Contacts", value: stats?.emergencyContacts ?? "—", icon: Activity, color: "yellow" },
  ];

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.name?.split(" ")[0] || "User"} 👋</h1>
          <p>Here's your safety overview for today</p>
        </div>
      </div>

      <div className="checkin-hero">
        <h2>You're Safe & Active</h2>
        <p>Your Guardian is active and monitoring. Emergency contacts are up to date.</p>
        <button className="checkin-btn">
          <Shield size={18} />
          I'm OK — Check In
        </button>
      </div>

      <div className="stats-grid">
        {statCards.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className={`stat-icon ${stat.color}`}>
              <stat.icon />
            </div>
            <div className="stat-info">
              <h3>{loading ? "..." : stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>Recent Activity</h3>
        </div>
        <div className="card-body">
          <div className="activity-list">
            {recentActivity.map((item, i) => (
              <div className="activity-item" key={i}>
                <div className={`activity-dot ${item.color}`} />
                <span className="activity-text">{item.text}</span>
                <span className="activity-time">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
EOF

# ── src/pages/Tasks.jsx — ORIGINAL DESIGN + real API ─────────────
cat > task-guardian-main/src/pages/Tasks.jsx << 'EOF'
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
EOF

# ── src/pages/Reminders.jsx — ORIGINAL DESIGN + real API ─────────
cat > task-guardian-main/src/pages/Reminders.jsx << 'EOF'
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
EOF

# ── src/pages/Notifications.jsx — ORIGINAL DESIGN + real API ─────
cat > task-guardian-main/src/pages/Notifications.jsx << 'EOF'
import { useState, useEffect } from "react";
import { Bell, CheckCircle2, AlertTriangle, Clock, Info, Trash2 } from "lucide-react";
import { notificationsAPI } from "../services/api";

const typeIcon = { info: Info, warning: AlertTriangle, success: CheckCircle2, error: AlertTriangle, reminder: Clock, alert: AlertTriangle, task: CheckCircle2 };

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  const load = () => {
    notificationsAPI.getAll()
      .then(d => setNotifications(d.data))
      .catch(e => setError(e.message));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await notificationsAPI.markRead(id).catch(e => setError(e.message));
    load();
  };

  const markAllRead = async () => {
    await Promise.all(notifications.filter(n => !n.isRead).map(n => notificationsAPI.markRead(n._id)));
    load();
  };

  const deleteNotif = async (id) => {
    await notificationsAPI.delete(id).catch(e => setError(e.message));
    load();
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>{unread} unread notification{unread !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={markAllRead}>Mark all read</button>
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem" }}>{error}</div>}

      <div className="section-gap" style={{ gap: "var(--space-sm)", maxWidth: 700 }}>
        {notifications.length === 0 && (
          <div style={{ textAlign: "center", padding: "var(--space-2xl)", color: "var(--color-text-muted)" }}>No notifications yet.</div>
        )}
        {notifications.map((notif) => {
          const IconComp = typeIcon[notif.type] || Bell;
          return (
            <div className={`notif-item ${!notif.isRead ? "unread" : ""}`} key={notif._id} onClick={() => !notif.isRead && markRead(notif._id)} style={{ cursor: !notif.isRead ? "pointer" : "default" }}>
              <div className={`notif-icon ${notif.type}`}><IconComp /></div>
              <div className="notif-content">
                <div className="notif-title-row">
                  <span className="notif-title">{notif.title}</span>
                  {!notif.isRead && <div className="notif-unread-dot" />}
                  {notif.emailSent && <span style={{ fontSize: "0.7rem", color: "var(--color-success)" }}>📧</span>}
                </div>
                <div className="notif-desc">{notif.message}</div>
                <div className="notif-time">{new Date(notif.createdAt).toLocaleString()}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); deleteNotif(notif._id); }}>
                <Trash2 size={14} style={{ color: "var(--color-danger)" }} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Notifications;
EOF

# ── src/pages/EmergencyContacts.jsx — ORIGINAL DESIGN + real API ─
cat > task-guardian-main/src/pages/EmergencyContacts.jsx << 'EOF'
import { useState, useEffect } from "react";
import { Phone, Mail, Trash2, UserPlus } from "lucide-react";
import { contactsAPI } from "../services/api";

const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

const EmergencyContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", relation: "" });
  const [error, setError] = useState("");

  const load = () => {
    contactsAPI.getAll()
      .then(d => setContacts(d.data))
      .catch(e => setError(e.message));
  };

  useEffect(() => { load(); }, []);

  const addContact = async () => {
    if (!form.name.trim()) return;
    await contactsAPI.create({ name: form.name, phone: form.phone, email: form.email, relationship: form.relation }).catch(e => setError(e.message));
    setForm({ name: "", phone: "", email: "", relation: "" });
    setShowForm(false);
    load();
  };

  const removeContact = async (id) => {
    await contactsAPI.delete(id).catch(e => setError(e.message));
    load();
  };

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1>Emergency Contacts</h1>
          <p>People who will be notified if you miss check-ins</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><UserPlus size={16} />Add Contact</button>
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem" }}>{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Relation</label>
                <input className="form-input" placeholder="Brother, Friend..." value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-md)" }}>
              <button className="btn btn-primary" onClick={addContact}>Save Contact</button>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        {contacts.length === 0 && (
          <div style={{ textAlign: "center", padding: "var(--space-2xl)", color: "var(--color-text-muted)" }}>No contacts yet. Add someone!</div>
        )}
        {contacts.map((contact, i) => (
          <div className="contact-card" key={contact._id}>
            <div className="contact-avatar" style={{ background: colors[i % colors.length] }}>
              {contact.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="contact-info">
              <div className="contact-name">{contact.name}</div>
              <div className="contact-detail">{contact.relationship}</div>
              <div className="contact-detail" style={{ display: "flex", gap: 16, marginTop: 4 }}>
                {contact.phone && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={12} />{contact.phone}</span>}
                {contact.email && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Mail size={12} />{contact.email}</span>}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => removeContact(contact._id)}>
              <Trash2 size={16} style={{ color: "var(--color-danger)" }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmergencyContacts;
EOF

# ── src/pages/admin/* — keep original admin pages, just wire API ──
cat > task-guardian-main/src/components/AdminLayout.jsx << 'EOF'
import { Link, useLocation, Navigate } from "react-router-dom";
import { Shield, LayoutDashboard, Users, Bell, Settings, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const adminNav = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/users", label: "Users", icon: Users },
  { path: "/admin/alerts", label: "Alerts", icon: Bell },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

const AdminLayout = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>Loading...</div>;
  if (!user || user.role !== "admin") return <Navigate to="/" replace />;

  return (
    <div className="app-wrapper">
      <aside className="sidebar" style={{ background: "var(--color-sidebar-admin, #1e1b4b)" }}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><Shield size={20} /></div>
          <div><h1>Guardian</h1><p>Admin Panel</p></div>
        </div>
        <nav className="sidebar-nav">
          {adminNav.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} className={`sidebar-link ${pathname === path ? "active" : ""}`}>
              <Icon />{label}
            </Link>
          ))}
          <Link to="/" className="sidebar-link">← Back to App</Link>
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={logout} style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}>
            <LogOut />Sign Out
          </button>
        </div>
      </aside>
      <div className="main-content">
        <main className="main-inner">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
EOF

cat > task-guardian-main/src/pages/admin/AdminDashboard.jsx << 'EOF'
import { useEffect, useState } from "react";
import { Users, CheckSquare, Clock } from "lucide-react";
import { adminAPI } from "../../services/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  useEffect(() => { adminAPI.getStats().then(d => setStats(d.data)).catch(console.error); }, []);
  const cards = [
    { label: "Total Users", value: stats?.userCount, icon: Users, color: "blue" },
    { label: "Total Tasks", value: stats?.taskCount, icon: CheckSquare, color: "green" },
    { label: "Total Reminders", value: stats?.reminderCount, icon: Clock, color: "yellow" },
  ];
  return (
    <div className="section-gap">
      <div className="page-header"><div><h1>Admin Dashboard</h1><p>System overview</p></div></div>
      <div className="stats-grid">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon ${color}`}><Icon /></div>
            <div className="stat-info"><h3>{value ?? "..."}</h3><p>{label}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default AdminDashboard;
EOF

cat > task-guardian-main/src/pages/admin/AdminUsers.jsx << 'EOF'
import { useEffect, useState } from "react";
import { adminAPI } from "../../services/api";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const load = () => adminAPI.getUsers().then(d => setUsers(d.data)).catch(console.error);
  useEffect(() => { load(); }, []);
  const toggle = async (id) => { await adminAPI.toggleUser(id); load(); };
  return (
    <div className="section-gap">
      <div className="page-header"><div><h1>Manage Users</h1><p>{users.length} total users</p></div></div>
      <div className="card">
        <div className="card-body" style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead><tr style={{ borderBottom: "1px solid var(--color-border)" }}>{["Name","Email","Role","Status","Action"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-muted)", fontWeight: 500 }}>{h}</th>)}</tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: "12px 16px", color: "var(--color-text-muted)" }}>{u.email}</td>
                  <td style={{ padding: "12px 16px" }}><span className={`badge ${u.role === "admin" ? "badge-red" : "badge-blue"}`}>{u.role}</span></td>
                  <td style={{ padding: "12px 16px" }}><span className={`badge ${u.isActive ? "badge-green" : "badge-gray"}`}>{u.isActive ? "Active" : "Disabled"}</span></td>
                  <td style={{ padding: "12px 16px" }}><button className={`btn btn-sm ${u.isActive ? "btn-outline" : "btn-primary"}`} onClick={() => toggle(u._id)}>{u.isActive ? "Disable" : "Enable"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AdminUsers;
EOF

cat > task-guardian-main/src/pages/admin/AdminAlerts.jsx << 'EOF'
const AdminAlerts = () => (
  <div className="section-gap">
    <div className="page-header"><div><h1>System Alerts</h1><p>Email & cron job status</p></div></div>
    <div className="card"><div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      {[
        { label: "Reminder cron", desc: "Runs every minute — sends emails for due reminders" },
        { label: "Task due cron", desc: "Runs every 10 minutes — alerts 1 hour before due date" },
        { label: "Birthday cron", desc: "Runs daily at 8 AM — sends birthday wish emails" },
        { label: "Welcome email", desc: "Sent immediately on user registration" },
        { label: "Notification email", desc: "Sent immediately when a notification is created" },
      ].map(({ label, desc }) => (
        <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-md)", padding: "var(--space-md)", background: "var(--color-bg-secondary)", borderRadius: 8 }}>
          <span style={{ color: "var(--color-success)", fontSize: "1.2rem" }}>✅</span>
          <div><p style={{ fontWeight: 600, marginBottom: 2 }}>{label}</p><p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>{desc}</p></div>
        </div>
      ))}
    </div></div>
  </div>
);
export default AdminAlerts;
EOF

cat > task-guardian-main/src/pages/admin/AdminSettings.jsx << 'EOF'
const AdminSettings = () => (
  <div className="section-gap">
    <div className="page-header"><div><h1>Settings</h1><p>Email & system configuration</p></div></div>
    <div className="card"><div className="card-body">
      <h3 style={{ marginBottom: "var(--space-md)" }}>Email Configuration (set in .env)</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        {["EMAIL_HOST","EMAIL_PORT","EMAIL_USER","EMAIL_PASS","EMAIL_FROM"].map(k => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", background: "var(--color-bg-secondary)", padding: "10px 16px", borderRadius: 8, fontFamily: "monospace", fontSize: "0.9rem" }}>
            <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>{k}</span>
            <span style={{ color: "var(--color-text-muted)" }}>— set in guardian-backend/.env</span>
          </div>
        ))}
      </div>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginTop: "var(--space-md)" }}>Use a Gmail App Password. Enable 2FA first in your Google account, then generate an App Password.</p>
    </div></div>
  </div>
);
export default AdminSettings;
EOF

# ── src/pages/NotFound.jsx ────────────────────────────────────────
cat > task-guardian-main/src/pages/NotFound.jsx << 'EOF'
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
const NotFound = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "var(--space-md)" }}>
    <Shield size={64} style={{ color: "var(--color-primary)" }} />
    <h1 style={{ fontSize: "4rem", fontWeight: 800 }}>404</h1>
    <p style={{ color: "var(--color-text-muted)" }}>Page not found</p>
    <Link to="/" className="btn btn-primary">Go Home</Link>
  </div>
);
export default NotFound;
EOF

echo "✅ All frontend files updated with original design + real API!"

# ── Git push ──────────────────────────────────────────────────────
echo ""
echo "🚀 Pushing to GitHub (college-project)..."
git add .
git commit -m "fix: restore original UI design with real backend API integration"
git push origin main

echo ""
echo "🎉 DONE! Original design restored + API wired in!"
echo ""
echo "Next steps:"
echo "  1. cd guardian-backend && npm install && npm run dev"
echo "  2. cd task-guardian-main && npm install && npm run dev"
