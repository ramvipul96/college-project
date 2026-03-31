# Guardian Backend API 🛡️

Node.js + Express + MongoDB backend for the Guardian Personal Alert & Reminder System.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
cd guardian-backend
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` and fill in your values:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/guardian
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

### 3. Start the server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:5000`

---

## 📁 Project Structure

```
guardian-backend/
├── src/
│   ├── models/
│   │   ├── User.js              # User schema (name, email, password, role, status)
│   │   ├── Task.js              # Task schema (title, priority, due, done)
│   │   ├── Reminder.js          # Reminder schema (title, time, repeat, active)
│   │   ├── EmergencyContact.js  # Contact schema (name, phone, email, relation)
│   │   ├── Notification.js      # Notification schema (type, title, desc, read)
│   │   ├── Alert.js             # Alert schema (type, status, contactNotified)
│   │   └── SystemSettings.js   # Admin system settings
│   ├── routes/
│   │   ├── auth.js              # Register, Login, Me
│   │   ├── dashboard.js         # Stats, Check-in
│   │   ├── tasks.js             # CRUD for tasks
│   │   ├── reminders.js         # CRUD for reminders
│   │   ├── emergencyContacts.js # CRUD for contacts
│   │   ├── notifications.js     # Get, mark-read, delete notifications
│   │   └── admin.js             # Admin: users, alerts, settings
│   ├── middleware/
│   │   └── auth.js              # JWT protect + adminOnly middleware
│   └── server.js                # Entry point
├── config/
│   └── db.js                    # MongoDB connection
├── .env.example
└── package.json
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint              | Description        | Auth |
|--------|-----------------------|--------------------|------|
| POST   | `/api/auth/register`  | Register new user  | ❌   |
| POST   | `/api/auth/login`     | Login              | ❌   |
| GET    | `/api/auth/me`        | Get current user   | ✅   |

### Dashboard
| Method | Endpoint                  | Description         | Auth |
|--------|---------------------------|---------------------|------|
| GET    | `/api/dashboard`          | Stats + activity    | ✅   |
| POST   | `/api/dashboard/checkin`  | "I'm OK" check-in   | ✅   |

### Tasks
| Method | Endpoint          | Description      | Auth |
|--------|-------------------|------------------|------|
| GET    | `/api/tasks`      | Get all tasks    | ✅   |
| POST   | `/api/tasks`      | Create task      | ✅   |
| PATCH  | `/api/tasks/:id`  | Update task      | ✅   |
| DELETE | `/api/tasks/:id`  | Delete task      | ✅   |

### Reminders
| Method | Endpoint              | Description         | Auth |
|--------|-----------------------|---------------------|------|
| GET    | `/api/reminders`      | Get all reminders   | ✅   |
| POST   | `/api/reminders`      | Create reminder     | ✅   |
| PATCH  | `/api/reminders/:id`  | Update/toggle       | ✅   |
| DELETE | `/api/reminders/:id`  | Delete reminder     | ✅   |

### Emergency Contacts
| Method | Endpoint            | Description      | Auth |
|--------|---------------------|------------------|------|
| GET    | `/api/contacts`     | Get all contacts | ✅   |
| POST   | `/api/contacts`     | Add contact      | ✅   |
| DELETE | `/api/contacts/:id` | Remove contact   | ✅   |

### Notifications
| Method | Endpoint                          | Description         | Auth |
|--------|-----------------------------------|---------------------|------|
| GET    | `/api/notifications`              | Get all             | ✅   |
| PATCH  | `/api/notifications/read-all`     | Mark all read       | ✅   |
| PATCH  | `/api/notifications/:id/read`     | Mark one read       | ✅   |
| DELETE | `/api/notifications/:id`          | Delete notification | ✅   |

### Admin (requires role: admin)
| Method | Endpoint                  | Description          |
|--------|---------------------------|----------------------|
| GET    | `/api/admin/dashboard`    | System-wide stats    |
| GET    | `/api/admin/users`        | All users            |
| GET    | `/api/admin/users/:id`    | Single user profile  |
| PATCH  | `/api/admin/users/:id`    | Update user          |
| DELETE | `/api/admin/users/:id`    | Delete user          |
| GET    | `/api/admin/alerts`       | All alerts           |
| PATCH  | `/api/admin/alerts/:id`   | Resolve alert        |
| GET    | `/api/admin/settings`     | Get system settings  |
| PUT    | `/api/admin/settings`     | Update settings      |

---

## 🔐 Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

You get this token from `/api/auth/login` or `/api/auth/register`.

---

## 🔗 Connecting the Frontend

In your React frontend, set the API base URL. Create a file like `src/lib/api.js`:

```js
const API_BASE = 'http://localhost:5000/api';

export const api = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  return res.json();
};
```

### Login example
```js
const data = await api('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
localStorage.setItem('token', data.token);
```

### Fetch tasks example
```js
const data = await api('/tasks');
// data.data → array of tasks
```

---

## 🛠 Creating an Admin User

After registering a normal user, open MongoDB Compass or run this in your terminal:

```bash
mongosh guardian
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

---

## 📦 Dependencies

| Package      | Purpose                    |
|--------------|----------------------------|
| express      | Web framework              |
| mongoose     | MongoDB ODM                |
| bcryptjs     | Password hashing           |
| jsonwebtoken | JWT authentication         |
| cors         | Cross-origin requests      |
| dotenv       | Environment variables      |
| nodemon      | Dev auto-restart           |
