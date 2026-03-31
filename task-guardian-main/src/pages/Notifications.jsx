import { Bell, CheckCircle2, AlertTriangle, Clock, Info } from "lucide-react";

const notifications = [
  { id: 1, type: "alert", icon: AlertTriangle, title: "Missed check-in detected", desc: "You haven't checked in for 6 hours. Emergency contacts will be notified in 2 hours.", time: "10 min ago", read: false },
  { id: 2, type: "task", icon: CheckCircle2, title: "Task completed: Call mom", desc: "Great job staying on track with your tasks!", time: "1 hour ago", read: false },
  { id: 3, type: "reminder", icon: Clock, title: "Reminder: Take medication", desc: "Your daily 9 AM medication reminder.", time: "2 hours ago", read: true },
  { id: 4, type: "info", icon: Info, title: "Profile updated", desc: "Your emergency contact list has been updated successfully.", time: "Yesterday", read: true },
  { id: 5, type: "reminder", icon: Bell, title: "Upcoming: Project deadline", desc: "Your project submission is due in 4 days.", time: "Yesterday", read: true },
  { id: 6, type: "alert", icon: AlertTriangle, title: "Inactivity alert sent", desc: "Emergency contact (Rahul) was notified about your inactivity.", time: "2 days ago", read: true },
];

const Notifications = () => {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>{unread} unread notification{unread !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-outline btn-sm">Mark all read</button>
      </div>

      <div className="section-gap" style={{ gap: "var(--space-sm)", maxWidth: 700 }}>
        {notifications.map((notif) => (
          <div className={`notif-item ${!notif.read ? "unread" : ""}`} key={notif.id}>
            <div className={`notif-icon ${notif.type}`}>
              <notif.icon />
            </div>
            <div className="notif-content">
              <div className="notif-title-row">
                <span className="notif-title">{notif.title}</span>
                {!notif.read && <div className="notif-unread-dot" />}
              </div>
              <div className="notif-desc">{notif.desc}</div>
              <div className="notif-time">{notif.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
