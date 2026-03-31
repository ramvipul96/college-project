import { useState, useEffect } from "react";
import { Phone, Mail, Trash2, UserPlus } from "lucide-react";
import { contactsAPI } from "../services/api";

const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

const EmergencyContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", relation: "" });
  const [error, setError] = useState("");

  const load = () => {
    contactsAPI.getAll()
      .then(d => setContacts(d.data))
      .catch(e => setError(e.message));
  };

  useEffect(() => { load(); }, []);

  const addContact = async () => {
    if (!form.name.trim()) return;
    await contactsAPI.create({ name: form.name, phone: form.phone, email: form.email, relationship: form.relation }).catch(e => setError(e.message));
    setForm({ name: "", phone: "", email: "", relation: "" });
    setShowForm(false);
    load();
  };

  const removeContact = async (id) => {
    await contactsAPI.delete(id).catch(e => setError(e.message));
    load();
  };

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1>Emergency Contacts</h1>
          <p>People who will be notified if you miss check-ins</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><UserPlus size={16} />Add Contact</button>
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem" }}>{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Relation</label>
                <input className="form-input" placeholder="Brother, Friend..." value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-md)" }}>
              <button className="btn btn-primary" onClick={addContact}>Save Contact</button>
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        {contacts.length === 0 && (
          <div style={{ textAlign: "center", padding: "var(--space-2xl)", color: "var(--color-text-muted)" }}>No contacts yet. Add someone!</div>
        )}
        {contacts.map((contact, i) => (
          <div className="contact-card" key={contact._id}>
            <div className="contact-avatar" style={{ background: colors[i % colors.length] }}>
              {contact.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="contact-info">
              <div className="contact-name">{contact.name}</div>
              <div className="contact-detail">{contact.relationship}</div>
              <div className="contact-detail" style={{ display: "flex", gap: 16, marginTop: 4 }}>
                {contact.phone && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={12} />{contact.phone}</span>}
                {contact.email && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Mail size={12} />{contact.email}</span>}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => removeContact(contact._id)}>
              <Trash2 size={16} style={{ color: "var(--color-danger)" }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmergencyContacts;
