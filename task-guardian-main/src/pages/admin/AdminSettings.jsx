const AdminSettings = () => (
  <div className="section-gap">
    <div className="page-header"><div><h1>Settings</h1><p>Email & system configuration</p></div></div>
    <div className="card"><div className="card-body">
      <h3 style={{ marginBottom: "var(--space-md)" }}>Email Configuration (set in .env)</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        {["EMAIL_HOST","EMAIL_PORT","EMAIL_USER","EMAIL_PASS","EMAIL_FROM"].map(k => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", background: "var(--color-bg-secondary)", padding: "10px 16px", borderRadius: 8, fontFamily: "monospace", fontSize: "0.9rem" }}>
            <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>{k}</span>
            <span style={{ color: "var(--color-text-muted)" }}>— set in guardian-backend/.env</span>
          </div>
        ))}
      </div>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginTop: "var(--space-md)" }}>Use a Gmail App Password. Enable 2FA first in your Google account, then generate an App Password.</p>
    </div></div>
  </div>
);
export default AdminSettings;
