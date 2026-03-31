import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Mail, Lock, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [tab, setTab]       = useState("login");
  const [form, setForm]     = useState({ name: "", email: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const user = tab === "login"
        ? await login(form.email, form.password)
        : await register(form.name, form.email, form.password);
      navigate(user.role === "admin" ? "/admin" : "/");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="icon"><Shield size={28} /></div>
          <h1>Guardian</h1>
          <p>Personal Alert & Reminder System</p>
        </div>
        <div className="login-tabs">
          <button className={`login-tab ${tab === "login" ? "active" : ""}`} onClick={() => { setTab("login"); setError(""); }}>Sign In</button>
          <button className={`login-tab ${tab === "register" ? "active" : ""}`} onClick={() => { setTab("register"); setError(""); }}>Register</button>
        </div>
        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem", marginBottom: "var(--space-md)" }}>
            {error}
          </div>
        )}
        <form className="login-form" onSubmit={handleSubmit}>
          {tab === "register" && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: "relative" }}>
                <User size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Your full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input className="form-input" style={{ paddingLeft: 36 }} type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input className="form-input" style={{ paddingLeft: 36 }} type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
          </div>
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: "100%", marginTop: "var(--space-sm)", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Please wait..." : tab === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
        <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "var(--space-lg)" }}>
          {tab === "login" ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: "var(--color-primary)", cursor: "pointer", fontWeight: 500 }} onClick={() => { setTab(tab === "login" ? "register" : "login"); setError(""); }}>
            {tab === "login" ? "Register" : "Sign In"}
          </span>
        </p>
      </div>
    </div>
  );
};
export default Login;
