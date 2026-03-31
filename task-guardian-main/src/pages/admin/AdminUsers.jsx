import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { adminAPI } from "../../services/api";

const statusBadge = { true: "badge-green", false: "badge-gray" };
const filters = ["All", "Active", "Disabled"];

const AdminUsers = () => {
  const [users, setUsers]   = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const load = () => adminAPI.getUsers().then(d => setUsers(d.data)).catch(console.error);
  useEffect(() => { load(); }, []);

  const toggle = async (id) => { await adminAPI.toggleUser(id); load(); };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || (filter === "Active" ? u.isActive : !u.isActive);
    return matchSearch && matchFilter;
  });

  return (
    <div className="section-gap">
      <div className="page-header">
        <div><h1>Manage Users</h1><p>{users.length} registered users</p></div>
      </div>
      <div style={{ display: "flex", gap: "var(--space-md)", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="filter-bar">
          {filters.map(f => <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>)}
        </div>
      </div>
      <div className="table-container">
        <table className="table">
          <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user._id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{user.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{user.email}</div>
                </td>
                <td><span className={`badge ${user.role === "admin" ? "badge-red" : "badge-blue"}`}>{user.role}</span></td>
                <td><span className={`badge ${user.isActive ? "badge-green" : "badge-gray"}`}>{user.isActive ? "Active" : "Disabled"}</span></td>
                <td style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn-outline btn-sm" onClick={() => toggle(user._id)}>
                    {user.isActive ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AdminUsers;
