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
