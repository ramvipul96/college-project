import { useEffect, useState } from "react";
import { adminAPI } from "../../services/api";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const load = () => adminAPI.getUsers().then(d => setUsers(d.data)).catch(console.error);
  useEffect(() => { load(); }, []);
  const toggle = async (id) => { await adminAPI.toggleUser(id); load(); };
  return (
    <div className="section-gap">
      <div className="page-header"><div><h1>Manage Users</h1><p>{users.length} total users</p></div></div>
      <div className="card">
        <div className="card-body" style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead><tr style={{ borderBottom: "1px solid var(--color-border)" }}>{["Name","Email","Role","Status","Action"].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-muted)", fontWeight: 500 }}>{h}</th>)}</tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: "12px 16px", color: "var(--color-text-muted)" }}>{u.email}</td>
                  <td style={{ padding: "12px 16px" }}><span className={`badge ${u.role === "admin" ? "badge-red" : "badge-blue"}`}>{u.role}</span></td>
                  <td style={{ padding: "12px 16px" }}><span className={`badge ${u.isActive ? "badge-green" : "badge-gray"}`}>{u.isActive ? "Active" : "Disabled"}</span></td>
                  <td style={{ padding: "12px 16px" }}><button className={`btn btn-sm ${u.isActive ? "btn-outline" : "btn-primary"}`} onClick={() => toggle(u._id)}>{u.isActive ? "Disable" : "Enable"}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AdminUsers;
