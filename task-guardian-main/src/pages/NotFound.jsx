import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
const NotFound = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "var(--space-md)" }}>
    <Shield size={64} style={{ color: "var(--color-primary)" }} />
    <h1 style={{ fontSize: "4rem", fontWeight: 800 }}>404</h1>
    <p style={{ color: "var(--color-text-muted)" }}>Page not found</p>
    <Link to="/" className="btn btn-primary">Go Home</Link>
  </div>
);
export default NotFound;
