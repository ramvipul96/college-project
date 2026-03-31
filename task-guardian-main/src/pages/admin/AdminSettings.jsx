import { useState } from "react";
import { Save } from "lucide-react";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    inactivityThreshold: "6", escalationDelay: "2", checkInTime: "09:00", maxContacts: "5",
    emailNotifs: true, smsNotifs: true, autoEscalate: true, dailyReports: false,
  });

  const update = (key, value) => setSettings({ ...settings, [key]: value });

  return (
    <div className="section-gap" style={{ maxWidth: 700 }}>
      <div className="page-header">
        <div><h1>System Settings</h1><p>Configure Guardian system behaviour</p></div>
        <button className="btn btn-primary"><Save size={16} />Save Changes</button>
      </div>

      <div className="card">
        <div className="card-header"><h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem" }}>Timing & Thresholds</h3></div>
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <div className="form-group"><label className="form-label">Inactivity Threshold (hours)</label><input className="form-input" type="number" value={settings.inactivityThreshold} onChange={(e) => update("inactivityThreshold", e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Escalation Delay (hours)</label><input className="form-input" type="number" value={settings.escalationDelay} onChange={(e) => update("escalationDelay", e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Default Check-in Time</label><input className="form-input" type="time" value={settings.checkInTime} onChange={(e) => update("checkInTime", e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Max Emergency Contacts per User</label><input className="form-input" type="number" value={settings.maxContacts} onChange={(e) => update("maxContacts", e.target.value)} /></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem" }}>Notifications</h3></div>
        <div className="card-body">
          <div className="setting-row">
            <div className="setting-info"><h4>Email Notifications</h4><p>Send alert notifications via email</p></div>
            <div className={`toggle ${settings.emailNotifs ? "active" : ""}`} onClick={() => update("emailNotifs", !settings.emailNotifs)} />
          </div>
          <div className="setting-row">
            <div className="setting-info"><h4>SMS Notifications</h4><p>Send alert notifications via SMS</p></div>
            <div className={`toggle ${settings.smsNotifs ? "active" : ""}`} onClick={() => update("smsNotifs", !settings.smsNotifs)} />
          </div>
          <div className="setting-row">
            <div className="setting-info"><h4>Auto-Escalation</h4><p>Automatically escalate to emergency contacts</p></div>
            <div className={`toggle ${settings.autoEscalate ? "active" : ""}`} onClick={() => update("autoEscalate", !settings.autoEscalate)} />
          </div>
          <div className="setting-row">
            <div className="setting-info"><h4>Daily Admin Reports</h4><p>Receive daily summary reports via email</p></div>
            <div className={`toggle ${settings.dailyReports ? "active" : ""}`} onClick={() => update("dailyReports", !settings.dailyReports)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
