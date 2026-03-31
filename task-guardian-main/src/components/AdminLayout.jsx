import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  Settings,
  Menu,
  X,
  Shield,
  ArrowLeft,
} from "lucide-react";

const adminNavItems = [
  { path: "/admin", label: "Admin Dashboard", icon: LayoutDashboard },
  { path: "/admin/users", label: "Manage Users", icon: Users },
  { path: "/admin/alerts", label: "Alert Logs", icon: AlertTriangle },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-wrapper">
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon accent">
            <Shield size={20} />
          </div>
          <div>
            <h1>Admin</h1>
            <p>Guardian Control Panel</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {adminNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive ? "active-accent" : ""}`}
              >
                <item.icon />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="sidebar-link">
            <ArrowLeft />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div>
          <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
          <aside className="mobile-sidebar">
            <div className="mobile-sidebar-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Shield size={20} style={{ color: "var(--color-accent)" }} />
                <span style={{ fontWeight: 700, fontFamily: "var(--font-display)" }}>Admin</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} style={{ color: "var(--color-text-muted)" }}>
                <X size={20} />
              </button>
            </div>
            <nav className="sidebar-nav">
              {adminNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`sidebar-link ${isActive ? "active-accent" : ""}`}
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
            <Shield size={20} style={{ color: "var(--color-accent)" }} />
            Admin Panel
          </div>
          <div style={{ width: 20 }} />
        </header>

        <main className="main-inner">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
