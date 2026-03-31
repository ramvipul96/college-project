import { useState, useEffect } from "react";
import { Bell, CheckCircle2, AlertTriangle, Clock, Info, Trash2 } from "lucide-react";
import { notificationsAPI } from "../services/api";

const typeIcon = { info: Info, warning: AlertTriangle, success: CheckCircle2, error: AlertTriangle, reminder: Clock, alert: AlertTriangle, task: CheckCircle2 };

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  const load = () => {
    notificationsAPI.getAll()
      .then(d => setNotifications(d.data))
      .catch(e => setError(e.message));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await notificationsAPI.markRead(id).catch(e => setError(e.message));
    load();
  };

  const markAllRead = async () => {
    await Promise.all(notifications.filter(n => !n.isRead).map(n => notificationsAPI.markRead(n._id)));
    load();
  };

  const deleteNotif = async (id) => {
    await notificationsAPI.delete(id).catch(e => setError(e.message));
    load();
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>{unread} unread notification{unread !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={markAllRead}>Mark all read</button>
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem" }}>{error}</div>}

      <div className="section-gap" style={{ gap: "var(--space-sm)", maxWidth: 700 }}>
        {notifications.length === 0 && (
          <div style={{ textAlign: "center", padding: "var(--space-2xl)", color: "var(--color-text-muted)" }}>No notifications yet.</div>
        )}
        {notifications.map((notif) => {
          const IconComp = typeIcon[notif.type] || Bell;
          return (
            <div className={`notif-item ${!notif.isRead ? "unread" : ""}`} key={notif._id} onClick={() => !notif.isRead && markRead(notif._id)} style={{ cursor: !notif.isRead ? "pointer" : "default" }}>
              <div className={`notif-icon ${notif.type}`}><IconComp /></div>
              <div className="notif-content">
                <div className="notif-title-row">
                  <span className="notif-title">{notif.title}</span>
                  {!notif.isRead && <div className="notif-unread-dot" />}
                  {notif.emailSent && <span style={{ fontSize: "0.7rem", color: "var(--color-success)" }}>📧</span>}
                </div>
                <div className="notif-desc">{notif.message}</div>
                <div className="notif-time">{new Date(notif.createdAt).toLocaleString()}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); deleteNotif(notif._id); }}>
                <Trash2 size={14} style={{ color: "var(--color-danger)" }} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Notifications;
