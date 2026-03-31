import { Link, useLocation, Navigate } from "react-router-dom";
import { Shield, LayoutDashboard, Users, Bell, Settings, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const adminNav = [
  { path: "/admin",          label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/users",    label: "Users",     icon: Users           },
  { path: "/admin/alerts",   label: "Alerts",    icon: Bell            },
  { path: "/admin/settings", label: "Settings",  icon: Settings        },
];

const AdminLayout = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>Loading...</div>;
  if (!user || user.role !== "admin") return <Navigate to="/" replace />;
  return (
    <div className="app-wrapper">
      <aside className="sidebar">
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
          <Link to="/" className="sidebar-link" style={{ marginTop: "var(--space-md)" }}>← Back to App</Link>
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={logout} style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", color: "var(--color-danger)" }}>
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
