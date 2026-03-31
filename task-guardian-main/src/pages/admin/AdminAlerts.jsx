const AdminAlerts = () => (
  <div className="section-gap">
    <div className="page-header"><div><h1>System Alerts</h1><p>Email & cron job status</p></div></div>
    <div className="card"><div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      {[
        { label: "Reminder cron", desc: "Runs every minute — sends emails for due reminders" },
        { label: "Task due cron", desc: "Runs every 10 minutes — alerts 1 hour before due date" },
        { label: "Birthday cron", desc: "Runs daily at 8 AM — sends birthday wish emails" },
        { label: "Welcome email", desc: "Sent immediately on user registration" },
        { label: "Notification email", desc: "Sent immediately when a notification is created" },
      ].map(({ label, desc }) => (
        <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-md)", padding: "var(--space-md)", background: "var(--color-bg-secondary)", borderRadius: 8 }}>
          <span style={{ color: "var(--color-success)", fontSize: "1.2rem" }}>✅</span>
          <div><p style={{ fontWeight: 600, marginBottom: 2 }}>{label}</p><p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>{desc}</p></div>
        </div>
      ))}
    </div></div>
  </div>
);
export default AdminAlerts;
