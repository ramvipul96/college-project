import { useState } from "react";
import { Phone, Mail, Trash2, UserPlus } from "lucide-react";

const initialContacts = [
  { id: 1, name: "Rahul Sharma", phone: "+91 98765 43210", email: "rahul@email.com", relation: "Brother", color: "#10b981" },
  { id: 2, name: "Priya Patel", phone: "+91 87654 32109", email: "priya@email.com", relation: "Friend", color: "#3b82f6" },
  { id: 3, name: "Dr. Amit Singh", phone: "+91 76543 21098", email: "dr.amit@email.com", relation: "Doctor", color: "#f59e0b" },
];

const EmergencyContacts = () => {
  const [contacts, setContacts] = useState(initialContacts);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", relation: "" });

  const addContact = () => {
    if (!form.name.trim()) return;
    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
    setContacts([...contacts, { ...form, id: Date.now(), color: colors[contacts.length % colors.length] }]);
    setForm({ name: "", phone: "", email: "", relation: "" }); setShowForm(false);
  };

  const removeContact = (id) => setContacts(contacts.filter((c) => c.id !== id));

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1>Emergency Contacts</h1>
          <p>People who will be notified if you miss check-ins</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}><UserPlus size={16} />Add Contact</button>
      </div>

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
        {contacts.map((contact) => (
          <div className="contact-card" key={contact.id}>
            <div className="contact-avatar" style={{ background: contact.color }}>
              {contact.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="contact-info">
              <div className="contact-name">{contact.name}</div>
              <div className="contact-detail">{contact.relation}</div>
              <div className="contact-detail" style={{ display: "flex", gap: 16, marginTop: 4 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={12} /> {contact.phone}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Mail size={12} /> {contact.email}</span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => removeContact(contact.id)}>
              <Trash2 size={16} style={{ color: "var(--color-danger)" }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmergencyContacts;
