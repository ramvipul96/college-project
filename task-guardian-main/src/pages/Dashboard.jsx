import { Shield, CheckSquare, Clock, AlertTriangle, Activity } from "lucide-react";

const stats = [
  { label: "Tasks Completed", value: "12", icon: CheckSquare, color: "green" },
  { label: "Active Reminders", value: "5", icon: Clock, color: "blue" },
  { label: "Alerts Sent", value: "2", icon: AlertTriangle, color: "red" },
  { label: "Days Active", value: "34", icon: Activity, color: "yellow" },
];

const recentActivity = [
  { text: "Checked in successfully", time: "2 min ago", color: "green" },
  { text: "Task 'Call doctor' completed", time: "1 hour ago", color: "blue" },
  { text: "Missed check-in alert sent", time: "Yesterday", color: "red" },
  { text: "Reminder 'Take medication' triggered", time: "Yesterday", color: "yellow" },
  { text: "Emergency contact updated", time: "2 days ago", color: "blue" },
];

const Dashboard = () => {
  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1>Welcome back, User 👋</h1>
          <p>Here's your safety overview for today</p>
        </div>
      </div>

      <div className="checkin-hero">
        <h2>You're Safe & Active</h2>
        <p>Last check-in was 2 minutes ago. Your emergency contacts are informed of your status.</p>
        <button className="checkin-btn">
          <Shield size={18} />
          I'm OK — Check In
        </button>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className={`stat-icon ${stat.color}`}>
              <stat.icon />
            </div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
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
