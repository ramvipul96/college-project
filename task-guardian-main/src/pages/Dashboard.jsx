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
