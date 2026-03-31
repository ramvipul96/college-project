import { Users, AlertTriangle, Activity, ShieldCheck } from "lucide-react";

const stats = [
  { label: "Total Users", value: "156", icon: Users, color: "blue" },
  { label: "Active Today", value: "89", icon: Activity, color: "green" },
  { label: "Alerts Triggered", value: "12", icon: AlertTriangle, color: "red" },
  { label: "Missed Check-ins", value: "7", icon: ShieldCheck, color: "yellow" },
];

const recentAlerts = [
  { user: "Ankit Verma", type: "Inactivity", status: "Escalated", time: "15 min ago" },
  { user: "Sneha Gupta", type: "Missed check-in", status: "Pending", time: "1 hour ago" },
  { user: "Ravi Kumar", type: "Inactivity", status: "Resolved", time: "3 hours ago" },
  { user: "Priya Shah", type: "Emergency trigger", status: "Escalated", time: "Yesterday" },
];

const systemLog = [
  { text: "System health check passed", time: "5 min ago", color: "green" },
  { text: "Email notification service restarted", time: "2 hours ago", color: "blue" },
  { text: "3 new user registrations", time: "Today", color: "blue" },
  { text: "Database backup completed", time: "Yesterday", color: "green" },
];

const statusBadge = { Escalated: "badge-red", Pending: "badge-yellow", Resolved: "badge-green" };

const AdminDashboard = () => (
  <div className="section-gap">
    <div className="page-header">
      <div>
        <h1>Admin Dashboard</h1>
        <p>System overview and monitoring</p>
      </div>
    </div>

    <div className="stats-grid">
      {stats.map((stat) => (
        <div className="stat-card" key={stat.label}>
          <div className={`stat-icon ${stat.color}`}><stat.icon /></div>
          <div className="stat-info"><h3>{stat.value}</h3><p>{stat.label}</p></div>
        </div>
      ))}
    </div>

    <div className="grid-2">
      <div className="card">
        <div className="card-header"><h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem" }}>Recent Alerts</h3></div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
            <table className="table">
              <thead><tr><th>User</th><th>Type</th><th>Status</th><th>Time</th></tr></thead>
              <tbody>
                {recentAlerts.map((a, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{a.user}</td>
                    <td>{a.type}</td>
                    <td><span className={`badge ${statusBadge[a.status]}`}>{a.status}</span></td>
                    <td style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>{a.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem" }}>System Activity</h3></div>
        <div className="card-body">
          <div className="activity-list">
            {systemLog.map((item, i) => (
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
  </div>
);

export default AdminDashboard;
