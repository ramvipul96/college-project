import { useState } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import {
  LayoutDashboard, Bell, CheckSquare, Clock,
  Users, AlertTriangle, Menu, X, Shield,
  LogOut, Settings, UserCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { path: "/",                   label: "Dashboard",          icon: LayoutDashboard },
  { path: "/tasks",              label: "Tasks",              icon: CheckSquare },
  { path: "/reminders",          label: "Reminders",          icon: Clock },
  { path: "/notifications",      label: "Notifications",      icon: Bell },
  { path: "/emergency-contacts", label: "Emergency Contacts", icon: Users },
];

const AppLayout = ({ children }) => {
  const location = useLocation();
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "var(--color-text-muted)" }}>
      Loading...
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-wrapper">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon primary"><Shield size={20} /></div>
          <div><h1>Guardian</h1><p>Alert & Reminder System</p></div>
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
          <Link to="/profile" className={`sidebar-link ${location.pathname === "/profile" ? "active" : ""}`}>
            <UserCircle />My Profile
          </Link>
          {user.role === "admin" && (
            <Link to="/admin" className="sidebar-link"><Settings />Admin Panel</Link>
          )}
          <button
            className="sidebar-link"
            onClick={logout}
            style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", color: "var(--color-danger)" }}
          >
            <LogOut />Sign Out
          </button>
        </div>
      </aside>

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
              <Link to="/profile" onClick={() => setSidebarOpen(false)} className="sidebar-link"><UserCircle />My Profile</Link>
            </nav>
          </aside>
        </div>
      )}

      <div className="main-content">
        <header className="mobile-header">
          <button onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="mobile-header-brand">
            <Shield size={20} style={{ color: "var(--color-primary)" }} />Guardian
          </div>
          <div style={{ width: 20 }} />
        </header>
        <main className="main-inner">{children}</main>
        <button className="floating-alert-btn" onClick={() => alert("🚨 Personal Alert Triggered!")} title="Personal Alert">
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
