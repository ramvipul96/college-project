import { useState } from "react";
import { Search } from "lucide-react";

const users = [
  { id: 1, name: "Ankit Verma", email: "ankit@email.com", status: "Active", lastLogin: "2 min ago", tasks: 8, alerts: 1 },
  { id: 2, name: "Sneha Gupta", email: "sneha@email.com", status: "Inactive", lastLogin: "6 hours ago", tasks: 12, alerts: 3 },
  { id: 3, name: "Ravi Kumar", email: "ravi@email.com", status: "Active", lastLogin: "30 min ago", tasks: 5, alerts: 0 },
  { id: 4, name: "Priya Shah", email: "priya@email.com", status: "Warning", lastLogin: "2 days ago", tasks: 3, alerts: 5 },
  { id: 5, name: "Mohit Jain", email: "mohit@email.com", status: "Active", lastLogin: "1 hour ago", tasks: 15, alerts: 0 },
  { id: 6, name: "Kavita Reddy", email: "kavita@email.com", status: "Inactive", lastLogin: "1 week ago", tasks: 2, alerts: 2 },
];

const statusBadge = { Active: "badge-green", Inactive: "badge-gray", Warning: "badge-red" };
const filters = ["All", "Active", "Inactive", "Warning"];

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (filter === "All" || u.status === filter);
  });

  return (
    <div className="section-gap">
      <div className="page-header">
        <div><h1>Manage Users</h1><p>{users.length} registered users</p></div>
      </div>

      <div style={{ display: "flex", gap: "var(--space-md)", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-bar">
          {filters.map((f) => (
            <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead><tr><th>User</th><th>Status</th><th>Last Login</th><th>Tasks</th><th>Alerts</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{user.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{user.email}</div>
                </td>
                <td><span className={`badge ${statusBadge[user.status]}`}>{user.status}</span></td>
                <td style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>{user.lastLogin}</td>
                <td>{user.tasks}</td>
                <td><span style={{ color: user.alerts > 0 ? "var(--color-danger)" : "var(--color-text-muted)", fontWeight: user.alerts > 0 ? 600 : 400 }}>{user.alerts}</span></td>
                <td><button className="btn btn-outline btn-sm">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
