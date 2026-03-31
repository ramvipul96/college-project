import { useState } from "react";
import { AlertTriangle, Phone, Mail } from "lucide-react";

const alerts = [
  { id: 1, user: "Ankit Verma", type: "Inactivity", status: "Escalated", time: "15 min ago", contact: "Rahul Sharma", method: "SMS + Email" },
  { id: 2, user: "Sneha Gupta", type: "Missed check-in", status: "Pending", time: "1 hour ago", contact: "-", method: "-" },
  { id: 3, user: "Ravi Kumar", type: "Inactivity", status: "Resolved", time: "3 hours ago", contact: "Priya Patel", method: "Email" },
  { id: 4, user: "Priya Shah", type: "Emergency trigger", status: "Escalated", time: "Yesterday", contact: "Dr. Amit Singh", method: "SMS + Call" },
  { id: 5, user: "Kavita Reddy", type: "Missed check-in", status: "Resolved", time: "2 days ago", contact: "Mohit Jain", method: "Email" },
];

const statusBadge = { Escalated: "badge-red", Pending: "badge-yellow", Resolved: "badge-green" };
const filters = ["All", "Escalated", "Pending", "Resolved"];

const AdminAlerts = () => {
  const [filter, setFilter] = useState("All");
  const filtered = alerts.filter((a) => filter === "All" || a.status === filter);

  return (
    <div className="section-gap">
      <div className="page-header">
        <div><h1>Alert Logs</h1><p>Monitor all system alerts and escalations</p></div>
      </div>

      <div className="filter-bar">
        {filters.map((f) => (
          <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="table-container">
        <table className="table">
          <thead><tr><th>User</th><th>Alert Type</th><th>Status</th><th>Contact Notified</th><th>Method</th><th>Time</th></tr></thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td style={{ fontWeight: 500 }}>{a.user}</td>
                <td><span style={{ display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} style={{ color: "var(--color-warning)" }} />{a.type}</span></td>
                <td><span className={`badge ${statusBadge[a.status]}`}>{a.status}</span></td>
                <td style={{ color: "var(--color-text-secondary)" }}>{a.contact}</td>
                <td><span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>{a.method !== "-" && (a.method.includes("SMS") ? <Phone size={12} /> : <Mail size={12} />)}{a.method}</span></td>
                <td style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{a.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAlerts;
