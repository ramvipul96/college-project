import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Calendar, Lock, Save } from "lucide-react";
import { profileAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [form, setForm]   = useState({ name: "", phone: "", address: "", birthdayMonth: "", birthdayDay: "", birthdayYear: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [msg, setMsg]     = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    profileAPI.get().then(d => {
      const u = d.data;
      setForm({
        name:          u.name || "",
        phone:         u.phone || "",
        address:       u.address || "",
        birthdayMonth: u.birthdayMonth || "",
        birthdayDay:   u.birthdayDay || "",
        birthdayYear:  u.birthdayYear || "",
      });
    }).catch(e => setError(e.message));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setMsg(""); setError("");
    try {
      await profileAPI.update({
        ...form,
        birthdayMonth: form.birthdayMonth ? Number(form.birthdayMonth) : undefined,
        birthdayDay:   form.birthdayDay   ? Number(form.birthdayDay)   : undefined,
        birthdayYear:  form.birthdayYear  ? Number(form.birthdayYear)  : undefined,
      });
      await refreshUser();
      setMsg("✅ Profile updated successfully!");
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault(); setPwMsg(""); setError("");
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwMsg("❌ Passwords don't match"); return; }
    setSavingPw(true);
    try {
      await profileAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPwMsg("✅ Password changed successfully!");
    } catch (err) { setPwMsg("❌ " + err.message); }
    finally { setSavingPw(false); }
  };

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p>Manage your personal details and birthday for email wishes</p>
        </div>
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem" }}>{error}</div>}

      {/* Profile Info */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem" }}>Personal Information</h3>
        </div>
        <div className="card-body">
          {/* Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", marginBottom: "var(--space-lg)" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.5rem", fontWeight: 700 }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: "1.1rem" }}>{user?.name}</p>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>{user?.email}</p>
              <span style={{ fontSize: "0.75rem" }} className={`badge ${user?.role === "admin" ? "badge-red" : "badge-blue"}`}>{user?.role}</span>
            </div>
          </div>

          {msg && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem", marginBottom: "var(--space-md)" }}>{msg}</div>}

          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
              <div className="form-group">
                <label className="form-label"><User size={14} style={{ display: "inline", marginRight: 4 }} />Full Name</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" required />
              </div>
              <div className="form-group">
                <label className="form-label"><Mail size={14} style={{ display: "inline", marginRight: 4 }} />Email (read only)</label>
                <input className="form-input" value={user?.email || ""} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
              </div>
              <div className="form-group">
                <label className="form-label"><Phone size={14} style={{ display: "inline", marginRight: 4 }} />Phone</label>
                <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div className="form-group">
                <label className="form-label"><MapPin size={14} style={{ display: "inline", marginRight: 4 }} />Address</label>
                <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Your city / address" />
              </div>
            </div>

            {/* Birthday section */}
            <div style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "var(--space-md)" }}>
              <p style={{ fontWeight: 600, marginBottom: "var(--space-sm)", display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={16} style={{ color: "var(--color-primary)" }} />
                🎂 My Birthday
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginBottom: "var(--space-md)" }}>
                Set your birthday to receive a special email wish from Guardian every year!
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "var(--space-md)" }}>
                <div className="form-group">
                  <label className="form-label">Month</label>
                  <select className="form-input" value={form.birthdayMonth} onChange={e => setForm({ ...form, birthdayMonth: e.target.value })}>
                    <option value="">Select month</option>
                    {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Day</label>
                  <input className="form-input" type="number" min="1" max="31" value={form.birthdayDay} onChange={e => setForm({ ...form, birthdayDay: e.target.value })} placeholder="Day" />
                </div>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input className="form-input" type="number" min="1900" max={new Date().getFullYear()} value={form.birthdayYear} onChange={e => setForm({ ...form, birthdayYear: e.target.value })} placeholder="Year" />
                </div>
              </div>
            </div>

            <div>
              <button className="btn btn-primary" type="submit" disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Save size={16} />{saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem" }}>Change Password</h3>
        </div>
        <div className="card-body">
          {pwMsg && (
            <div style={{ background: pwMsg.startsWith("✅") ? "#f0fdf4" : "#fef2f2", border: `1px solid ${pwMsg.startsWith("✅") ? "#bbf7d0" : "#fecaca"}`, color: pwMsg.startsWith("✅") ? "#16a34a" : "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem", marginBottom: "var(--space-md)" }}>
              {pwMsg}
            </div>
          )}
          <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)", maxWidth: 400 }}>
            <div className="form-group">
              <label className="form-label"><Lock size={14} style={{ display: "inline", marginRight: 4 }} />Current Password</label>
              <input className="form-input" type="password" value={pwForm.currentPassword} onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} placeholder="••••••••" required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} placeholder="••••••••" required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type="password" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} placeholder="••••••••" required />
            </div>
            <div>
              <button className="btn btn-primary" type="submit" disabled={savingPw}>
                {savingPw ? "Updating..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default Profile;
