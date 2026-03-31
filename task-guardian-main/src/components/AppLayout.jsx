import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Bell,
  CheckSquare,
  Clock,
  Users,
  AlertTriangle,
  Menu,
  X,
  Shield,
  LogOut,
  Settings,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/tasks", label: "Tasks", icon: CheckSquare },
  { path: "/reminders", label: "Reminders", icon: Clock },
  { path: "/notifications", label: "Notifications", icon: Bell },
  { path: "/emergency-contacts", label: "Emergency Contacts", icon: Users },
];

const AppLayout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-wrapper">
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon primary">
            <Shield size={20} />
          </div>
          <div>
            <h1>Guardian</h1>
            <p>Alert & Reminder System</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive ? "active" : ""}`}
              >
                <item.icon />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Link to="/admin" className="sidebar-link">
            <Settings />
            Admin Panel
          </Link>
          <Link to="/login" className="sidebar-link">
            <LogOut />
            Sign Out
          </Link>
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
              <button onClick={() => setSidebarOpen(false)} style={{ color: "var(--color-text-muted)" }}>
                <X size={20} />
              </button>
            </div>
            <nav className="sidebar-nav">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`sidebar-link ${isActive ? "active" : ""}`}
                  >
                    <item.icon />
                    {item.label}
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
          <button onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="mobile-header-brand">
            <Shield size={20} style={{ color: "var(--color-primary)" }} />
            Guardian
          </div>
          <div style={{ width: 20 }} />
        </header>

        <main className="main-inner">{children}</main>

        {/* Floating Alert Button */}
        <button
          className="floating-alert-btn"
          onClick={() => alert("🚨 Personal Alert Triggered! Emergency contacts will be notified.")}
          title="Personal Alert"
        >
          <AlertTriangle />
        </button>

        {/* Mobile Bottom Nav */}
        <nav className="mobile-bottom-nav">
          {navItems.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-link ${isActive ? "active" : ""}`}
              >
                <item.icon />
                {item.label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AppLayout;
