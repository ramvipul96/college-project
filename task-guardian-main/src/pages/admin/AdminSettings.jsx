const AdminSettings = () => (
  <div className="section-gap">
    <div className="page-header"><div><h1>Settings</h1><p>Email & system configuration</p></div></div>
    <div className="card"><div className="card-body">
      <h3 style={{ marginBottom: "var(--space-md)" }}>Email Configuration (guardian-backend/.env)</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        {[
          ["EMAIL_HOST",  "smtp.gmail.com"],
          ["EMAIL_PORT",  "587"],
          ["EMAIL_USER",  "your_gmail@gmail.com"],
          ["EMAIL_PASS",  "your 16-char Gmail App Password"],
          ["EMAIL_FROM",  '"Guardian App <your_gmail@gmail.com>"'],
        ].map(([k, hint]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", background: "var(--color-bg-secondary)", padding: "10px 16px", borderRadius: 8, fontFamily: "monospace", fontSize: "0.875rem" }}>
            <span style={{ color: "var(--color-primary)", fontWeight: 600, minWidth: 130 }}>{k}</span>
            <span style={{ color: "var(--color-text-muted)" }}>{hint}</span>
          </div>
        ))}
      </div>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginTop: "var(--space-md)" }}>
        💡 Use a Gmail App Password — go to Google Account → Security → 2-Step Verification → App Passwords → Generate
      </p>
    </div></div>
  </div>
);
export default AdminSettings;
