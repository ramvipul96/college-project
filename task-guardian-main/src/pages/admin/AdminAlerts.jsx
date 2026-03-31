const AdminAlerts = () => (
  <div className="section-gap">
    <div className="page-header"><div><h1>System Alerts</h1><p>Cron job & email delivery status</p></div></div>
    <div className="card"><div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      {[
        { label: "Reminder cron",       desc: "Every minute — 2-min window, retries failed sends up to 3x, handles repeating reminders" },
        { label: "Task due cron",       desc: "Every 10 minutes — sends alert when task is due within 1 hour, one email per task" },
        { label: "Birthday cron",       desc: "Daily at 8 AM — sends wish for contacts + user's own birthday, tracks year to avoid duplicates" },
        { label: "Welcome email",       desc: "Instant — sent when a new user registers" },
        { label: "Notification email",  desc: "Instant — sent when a notification is created" },
      ].map(({ label, desc }) => (
        <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-md)", padding: "var(--space-md)", background: "var(--color-bg-secondary)", borderRadius: 8 }}>
          <span style={{ color: "var(--color-success)", fontSize: "1.2rem", marginTop: 2 }}>✅</span>
          <div><p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p><p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>{desc}</p></div>
        </div>
      ))}
    </div></div>
  </div>
);
export default AdminAlerts;
