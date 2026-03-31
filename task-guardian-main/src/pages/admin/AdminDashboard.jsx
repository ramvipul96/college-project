import { useEffect, useState } from "react";
import { Users, AlertTriangle, Activity, ShieldCheck } from "lucide-react";
import { adminAPI } from "../../services/api";

const statusBadge = { Escalated: "badge-red", Pending: "badge-yellow", Resolved: "badge-green" };

const recentAlerts = [
  { user: "System", type: "Reminder cron", status: "Resolved", time: "1 min ago" },
  { user: "System", type: "Task due check", status: "Resolved", time: "10 min ago" },
  { user: "System", type: "Birthday check", status: "Resolved", time: "8 AM today" },
];
const systemLog = [
  { text: "Reminder cron running (every minute)", time: "Live", color: "green" },
  { text: "Task due cron running (every 10 min)", time: "Live", color: "green" },
  { text: "Birthday cron running (daily 8 AM)",   time: "Live", color: "green" },
  { text: "Email service connected",              time: "Live", color: "blue" },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminAPI.getStats().then(d => setStats(d.data)).catch(console.error);
  }, []);

  const statCards = [
    { label: "Total Users",     value: stats?.userCount     ?? "...", icon: Users,      color: "blue"   },
    { label: "Total Tasks",     value: stats?.taskCount     ?? "...", icon: Activity,   color: "green"  },
    { label: "Total Reminders", value: stats?.reminderCount ?? "...", icon: ShieldCheck, color: "yellow" },
    { label: "System Alerts",   value: recentAlerts.length,           icon: AlertTriangle, color: "red" },
  ];

  return (
    <div className="section-gap">
      <div className="page-header">
        <div><h1>Admin Dashboard</h1><p>System overview and monitoring</p></div>
      </div>
      <div className="stats-grid">
        {statCards.map(stat => (
          <div className="stat-card" key={stat.label}>
            <div className={`stat-icon ${stat.color}`}><stat.icon /></div>
            <div className="stat-info"><h3>{stat.value}</h3><p>{stat.label}</p></div>
          </div>
        ))}
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem" }}>Recent System Alerts</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
              <table className="table">
                <thead><tr><th>Source</th><th>Type</th><th>Status</th><th>Time</th></tr></thead>
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
};
export default AdminDashboard;
