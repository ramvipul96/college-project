#!/bin/bash
set -e

echo "🛡️  Guardian Project Setup Script"
echo "=================================="

# ── Go into your cloned repo ──────────────────────────────────────
# Make sure you have already cloned: git clone https://github.com/ramvipul96/college-project.git
cd "$(dirname "$0")"

# ═══════════════════════════════════════════════════════════════════
# BACKEND FILES
# ═══════════════════════════════════════════════════════════════════
echo "📁 Setting up backend..."

mkdir -p guardian-backend/config
mkdir -p guardian-backend/src/services
mkdir -p guardian-backend/src/cron
mkdir -p guardian-backend/src/middleware
mkdir -p guardian-backend/src/models
mkdir -p guardian-backend/src/routes

# ── package.json ──────────────────────────────────────────────────
cat > guardian-backend/package.json << 'EOF'
{
  "name": "guardian-backend",
  "version": "1.0.0",
  "description": "Backend API for Guardian - Personal Alert & Reminder System",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.3.4",
    "nodemailer": "^6.9.13",
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
EOF

# ── .env.example ──────────────────────────────────────────────────
cat > guardian-backend/.env.example << 'EOF'
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/guardian
JWT_SECRET=your_super_secret_jwt_key_here

# Nodemailer (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM="Guardian App <your_gmail@gmail.com>"
EOF

# ── config/db.js ──────────────────────────────────────────────────
cat > guardian-backend/config/db.js << 'EOF'
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
EOF

# ── src/server.js ─────────────────────────────────────────────────
cat > guardian-backend/src/server.js << 'EOF'
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('../config/db');
const { initCronJobs } = require('./cron/scheduler');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const taskRoutes = require('./routes/tasks');
const reminderRoutes = require('./routes/reminders');
const emergencyContactRoutes = require('./routes/emergencyContacts');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

connectDB();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/contacts', emergencyContactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Guardian API is running 🛡️' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Guardian server running on http://localhost:${PORT}`);
  initCronJobs();
});
EOF

# ── src/services/emailService.js ──────────────────────────────────
cat > guardian-backend/src/services/emailService.js << 'EOF'
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

transporter.verify((err) => {
  if (err) console.error('❌ Email transporter error:', err.message);
  else console.log('📧 Email service ready');
});

const sendEmail = async ({ to, subject, html }) => {
  const info = await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
  console.log(`📨 Email sent to ${to}: ${info.messageId}`);
  return info;
};

const sendReminderEmail = async (user, reminder) => {
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
    <div style="background:#4f46e5;padding:24px;color:white"><h2 style="margin:0">🛡️ Guardian Reminder</h2></div>
    <div style="padding:24px">
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>This is your scheduled reminder:</p>
      <div style="background:#f3f4f6;border-left:4px solid #4f46e5;padding:16px;border-radius:4px;margin:16px 0">
        <h3 style="margin:0 0 8px">${reminder.title}</h3>
        ${reminder.description ? `<p style="margin:0;color:#6b7280">${reminder.description}</p>` : ''}
      </div>
      <p style="color:#6b7280;font-size:14px">Scheduled for: <strong>${new Date(reminder.dateTime).toLocaleString()}</strong></p>
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center;color:#9ca3af;font-size:12px">© ${new Date().getFullYear()} Guardian App</div>
  </div>`;
  return sendEmail({ to: user.email, subject: `⏰ Reminder: ${reminder.title}`, html });
};

const sendTaskDueEmail = async (user, task) => {
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
    <div style="background:#dc2626;padding:24px;color:white"><h2 style="margin:0">📋 Task Due Soon</h2></div>
    <div style="padding:24px">
      <p>Hi <strong>${user.name}</strong>,</p>
      <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;border-radius:4px;margin:16px 0">
        <h3 style="margin:0 0 8px">${task.title}</h3>
        ${task.description ? `<p style="margin:0;color:#6b7280">${task.description}</p>` : ''}
        <p style="margin:8px 0 0;color:#dc2626;font-weight:bold">Priority: ${task.priority || 'Normal'}</p>
      </div>
      <p style="color:#6b7280;font-size:14px">Due: <strong>${new Date(task.dueDate).toLocaleString()}</strong></p>
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center;color:#9ca3af;font-size:12px">© ${new Date().getFullYear()} Guardian App</div>
  </div>`;
  return sendEmail({ to: user.email, subject: `📋 Task Due Soon: ${task.title}`, html });
};

const sendNotificationEmail = async (user, notification) => {
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
    <div style="background:#0891b2;padding:24px;color:white"><h2 style="margin:0">🔔 Guardian Notification</h2></div>
    <div style="padding:24px">
      <p>Hi <strong>${user.name}</strong>,</p>
      <div style="background:#ecfeff;border-left:4px solid #0891b2;padding:16px;border-radius:4px;margin:16px 0">
        <h3 style="margin:0 0 8px">${notification.title}</h3>
        <p style="margin:0;color:#374151">${notification.message}</p>
      </div>
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center;color:#9ca3af;font-size:12px">© ${new Date().getFullYear()} Guardian App</div>
  </div>`;
  return sendEmail({ to: user.email, subject: `🔔 ${notification.title}`, html });
};

const sendWishesEmail = async (user, contact) => {
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
    <div style="background:#7c3aed;padding:24px;color:white"><h2 style="margin:0">🎂 Birthday Reminder!</h2></div>
    <div style="padding:24px">
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Don't forget — it's <strong>${contact.name}</strong>'s birthday today! 🎉</p>
      <div style="background:#faf5ff;border-left:4px solid #7c3aed;padding:16px;border-radius:4px;margin:16px 0">
        <p style="margin:0">📞 ${contact.phone || 'No phone saved'}</p>
        <p style="margin:8px 0 0">📧 ${contact.email || 'No email saved'}</p>
      </div>
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center;color:#9ca3af;font-size:12px">© ${new Date().getFullYear()} Guardian App</div>
  </div>`;
  return sendEmail({ to: user.email, subject: `🎂 Birthday Today: ${contact.name}`, html });
};

const sendWelcomeEmail = async (user) => {
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
    <div style="background:#4f46e5;padding:24px;color:white"><h2 style="margin:0">🛡️ Welcome to Guardian!</h2></div>
    <div style="padding:24px">
      <p>Hi <strong>${user.name}</strong>,</p>
      <p>Welcome to <strong>Guardian</strong> — your personal alert & reminder system!</p>
      <ul style="color:#374151;line-height:1.8">
        <li>✅ Create and manage <strong>tasks</strong></li>
        <li>⏰ Set <strong>reminders</strong> with email notifications</li>
        <li>🔔 Receive <strong>alerts & notifications</strong></li>
        <li>📞 Manage <strong>emergency contacts</strong></li>
      </ul>
    </div>
    <div style="background:#f9fafb;padding:16px;text-align:center;color:#9ca3af;font-size:12px">© ${new Date().getFullYear()} Guardian App</div>
  </div>`;
  return sendEmail({ to: user.email, subject: '🛡️ Welcome to Guardian!', html });
};

module.exports = { sendEmail, sendReminderEmail, sendTaskDueEmail, sendNotificationEmail, sendWishesEmail, sendWelcomeEmail };
EOF

# ── src/cron/scheduler.js ─────────────────────────────────────────
cat > guardian-backend/src/cron/scheduler.js << 'EOF'
const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const Task = require('../models/Task');
const EmergencyContact = require('../models/EmergencyContact');
const { sendReminderEmail, sendTaskDueEmail, sendWishesEmail } = require('../services/emailService');

const checkReminders = async () => {
  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 60 * 1000);
    const dueReminders = await Reminder.find({ dateTime: { $gte: now, $lte: windowEnd }, emailSent: false, isActive: true }).populate('user');
    for (const reminder of dueReminders) {
      if (reminder.user?.email) {
        await sendReminderEmail(reminder.user, reminder);
        reminder.emailSent = true;
        await reminder.save();
        console.log(`📧 Reminder email sent: "${reminder.title}" → ${reminder.user.email}`);
      }
    }
  } catch (err) { console.error('Cron reminder error:', err.message); }
};

const checkTasksDue = async () => {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const tenMinsLater = new Date(now.getTime() + 10 * 60 * 1000);
    const dueTasks = await Task.find({ dueDate: { $gte: tenMinsLater, $lte: oneHourLater }, emailSent: false, status: { $ne: 'completed' } }).populate('user');
    for (const task of dueTasks) {
      if (task.user?.email) {
        await sendTaskDueEmail(task.user, task);
        task.emailSent = true;
        await task.save();
        console.log(`📧 Task due email sent: "${task.title}" → ${task.user.email}`);
      }
    }
  } catch (err) { console.error('Cron task error:', err.message); }
};

const checkBirthdays = async () => {
  try {
    const now = new Date();
    const contacts = await EmergencyContact.find({ birthdayMonth: now.getMonth() + 1, birthdayDay: now.getDate() }).populate('user');
    for (const contact of contacts) {
      if (contact.user?.email) {
        await sendWishesEmail(contact.user, contact);
        console.log(`🎂 Birthday wish sent for ${contact.name} → ${contact.user.email}`);
      }
    }
  } catch (err) { console.error('Cron birthday error:', err.message); }
};

const initCronJobs = () => {
  cron.schedule('* * * * *', checkReminders);
  console.log('⏰ Reminder cron job started (every minute)');
  cron.schedule('*/10 * * * *', checkTasksDue);
  console.log('📋 Task due cron job started (every 10 minutes)');
  cron.schedule('0 8 * * *', checkBirthdays);
  console.log('🎂 Birthday cron job started (daily at 8 AM)');
};

module.exports = { initCronJobs };
EOF

# ── src/middleware/auth.js ─────────────────────────────────────────
cat > guardian-backend/src/middleware/auth.js << 'EOF'
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'No token provided' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ success: false, message: 'User not found' });
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
};

module.exports = { protect, adminOnly };
EOF

# ── src/models/User.js ────────────────────────────────────────────
cat > guardian-backend/src/models/User.js << 'EOF'
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
EOF

# ── src/models/Task.js ────────────────────────────────────────────
cat > guardian-backend/src/models/Task.js << 'EOF'
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status:      { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate:     { type: Date },
  emailSent:   { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
EOF

# ── src/models/Reminder.js ────────────────────────────────────────
cat > guardian-backend/src/models/Reminder.js << 'EOF'
const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  dateTime:    { type: Date, required: true },
  isActive:    { type: Boolean, default: true },
  emailSent:   { type: Boolean, default: false },
  repeat:      { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);
EOF

# ── src/models/Notification.js ────────────────────────────────────
cat > guardian-backend/src/models/Notification.js << 'EOF'
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  type:      { type: String, enum: ['info', 'warning', 'success', 'error'], default: 'info' },
  isRead:    { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
EOF

# ── src/models/EmergencyContact.js ───────────────────────────────
cat > guardian-backend/src/models/EmergencyContact.js << 'EOF'
const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:          { type: String, required: true, trim: true },
  phone:         { type: String, default: '' },
  email:         { type: String, default: '' },
  relationship:  { type: String, default: '' },
  birthdayMonth: { type: Number, min: 1, max: 12 },
  birthdayDay:   { type: Number, min: 1, max: 31 },
}, { timestamps: true });

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);
EOF

# ── src/routes/auth.js ────────────────────────────────────────────
cat > guardian-backend/src/routes/auth.js << 'EOF'
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../services/emailService');
const router = express.Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields required' });
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password });
    sendWelcomeEmail(user).catch(console.error);
    res.status(201).json({ success: true, token: signToken(user._id), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    res.json({ success: true, token: signToken(user._id), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
EOF

# ── src/routes/tasks.js ───────────────────────────────────────────
cat > guardian-backend/src/routes/tasks.js << 'EOF'
const express = require('express');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: tasks });
});
router.post('/', protect, async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: task });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
router.put('/:id', protect, async (req, res) => {
  const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true });
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
  res.json({ success: true, data: task });
});
router.delete('/:id', protect, async (req, res) => {
  await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true, message: 'Task deleted' });
});

module.exports = router;
EOF

# ── src/routes/reminders.js ───────────────────────────────────────
cat > guardian-backend/src/routes/reminders.js << 'EOF'
const express = require('express');
const Reminder = require('../models/Reminder');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  const reminders = await Reminder.find({ user: req.user._id }).sort({ dateTime: 1 });
  res.json({ success: true, data: reminders });
});
router.post('/', protect, async (req, res) => {
  try {
    const reminder = await Reminder.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: reminder });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
router.put('/:id', protect, async (req, res) => {
  const reminder = await Reminder.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { ...req.body, emailSent: false },
    { new: true }
  );
  if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
  res.json({ success: true, data: reminder });
});
router.delete('/:id', protect, async (req, res) => {
  await Reminder.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true, message: 'Reminder deleted' });
});

module.exports = router;
EOF

# ── src/routes/notifications.js ───────────────────────────────────
cat > guardian-backend/src/routes/notifications.js << 'EOF'
const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { sendNotificationEmail } = require('../services/emailService');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  const notifs = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: notifs });
});
router.post('/', protect, async (req, res) => {
  try {
    const notif = await Notification.create({ ...req.body, user: req.user._id });
    sendNotificationEmail(req.user, notif).catch(console.error);
    notif.emailSent = true;
    await notif.save();
    res.status(201).json({ success: true, data: notif });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
router.put('/:id/read', protect, async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id }, { isRead: true }, { new: true }
  );
  res.json({ success: true, data: notif });
});
router.delete('/:id', protect, async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true, message: 'Notification deleted' });
});

module.exports = router;
EOF

# ── src/routes/emergencyContacts.js ──────────────────────────────
cat > guardian-backend/src/routes/emergencyContacts.js << 'EOF'
const express = require('express');
const EmergencyContact = require('../models/EmergencyContact');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  const contacts = await EmergencyContact.find({ user: req.user._id }).sort({ name: 1 });
  res.json({ success: true, data: contacts });
});
router.post('/', protect, async (req, res) => {
  try {
    const contact = await EmergencyContact.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: contact });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
router.put('/:id', protect, async (req, res) => {
  const contact = await EmergencyContact.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id }, req.body, { new: true }
  );
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
  res.json({ success: true, data: contact });
});
router.delete('/:id', protect, async (req, res) => {
  await EmergencyContact.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true, message: 'Contact deleted' });
});

module.exports = router;
EOF

# ── src/routes/dashboard.js ───────────────────────────────────────
cat > guardian-backend/src/routes/dashboard.js << 'EOF'
const express = require('express');
const Task = require('../models/Task');
const Reminder = require('../models/Reminder');
const Notification = require('../models/Notification');
const EmergencyContact = require('../models/EmergencyContact');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const uid = req.user._id;
    const [tasks, reminders, notifications, contacts] = await Promise.all([
      Task.find({ user: uid }),
      Reminder.find({ user: uid, isActive: true }),
      Notification.find({ user: uid, isRead: false }),
      EmergencyContact.find({ user: uid }),
    ]);
    res.json({ success: true, data: {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      activeReminders: reminders.length,
      unreadNotifications: notifications.length,
      emergencyContacts: contacts.length,
    }});
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
EOF

# ── src/routes/admin.js ───────────────────────────────────────────
cat > guardian-backend/src/routes/admin.js << 'EOF'
const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const Reminder = require('../models/Reminder');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/users', protect, adminOnly, async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ success: true, data: users });
});
router.put('/users/:id/toggle', protect, adminOnly, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, data: user });
});
router.get('/stats', protect, adminOnly, async (req, res) => {
  const [userCount, taskCount, reminderCount] = await Promise.all([
    User.countDocuments(), Task.countDocuments(), Reminder.countDocuments(),
  ]);
  res.json({ success: true, data: { userCount, taskCount, reminderCount } });
});

module.exports = router;
EOF

echo "✅ Backend files created!"

# ═══════════════════════════════════════════════════════════════════
# FRONTEND FILES
# ═══════════════════════════════════════════════════════════════════
echo "📁 Setting up frontend..."

mkdir -p task-guardian-main/src/context
mkdir -p task-guardian-main/src/services
mkdir -p task-guardian-main/src/pages/admin
mkdir -p task-guardian-main/src/components

# ── .env ──────────────────────────────────────────────────────────
cat > task-guardian-main/.env << 'EOF'
VITE_API_URL=http://localhost:5000/api
EOF

# ── src/services/api.js ───────────────────────────────────────────
cat > task-guardian-main/src/services/api.js << 'EOF'
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('guardian_token');
const headers = () => ({ 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) });
const request = async (method, path, body) => {
  const res = await fetch(`${BASE_URL}${path}`, { method, headers: headers(), ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};
const get = (p) => request('GET', p);
const post = (p, b) => request('POST', p, b);
const put = (p, b) => request('PUT', p, b);
const del = (p) => request('DELETE', p);

export const authAPI = { login: (e,p) => post('/auth/login',{email:e,password:p}), register: (n,e,p) => post('/auth/register',{name:n,email:e,password:p}), me: () => get('/auth/me') };
export const dashboardAPI = { getStats: () => get('/dashboard') };
export const tasksAPI = { getAll: () => get('/tasks'), create: (t) => post('/tasks',t), update: (id,t) => put(`/tasks/${id}`,t), delete: (id) => del(`/tasks/${id}`) };
export const remindersAPI = { getAll: () => get('/reminders'), create: (r) => post('/reminders',r), update: (id,r) => put(`/reminders/${id}`,r), delete: (id) => del(`/reminders/${id}`) };
export const notificationsAPI = { getAll: () => get('/notifications'), create: (n) => post('/notifications',n), markRead: (id) => put(`/notifications/${id}/read`), delete: (id) => del(`/notifications/${id}`) };
export const contactsAPI = { getAll: () => get('/contacts'), create: (c) => post('/contacts',c), update: (id,c) => put(`/contacts/${id}`,c), delete: (id) => del(`/contacts/${id}`) };
export const adminAPI = { getUsers: () => get('/admin/users'), toggleUser: (id) => put(`/admin/users/${id}/toggle`), getStats: () => get('/admin/stats') };
export const saveToken = (t) => localStorage.setItem('guardian_token', t);
export const clearToken = () => localStorage.removeItem('guardian_token');
export const isLoggedIn = () => !!getToken();
EOF

# ── src/context/AuthContext.jsx ───────────────────────────────────
cat > task-guardian-main/src/context/AuthContext.jsx << 'EOF'
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, saveToken, clearToken, isLoggedIn } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn()) {
      authAPI.me().then(d => setUser(d.user)).catch(() => clearToken()).finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    saveToken(data.token); setUser(data.user); return data.user;
  };
  const register = async (name, email, password) => {
    const data = await authAPI.register(name, email, password);
    saveToken(data.token); setUser(data.user); return data.user;
  };
  const logout = () => { clearToken(); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
EOF

# ── src/main.jsx ──────────────────────────────────────────────────
cat > task-guardian-main/src/main.jsx << 'EOF'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
EOF

# ── src/pages/Login.jsx ───────────────────────────────────────────
cat > task-guardian-main/src/pages/Login.jsx << 'EOF'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const user = isRegister ? await register(form.name, form.email, form.password) : await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🛡️</div>
          <h1 className="text-2xl font-bold text-gray-800">Guardian</h1>
          <p className="text-gray-500 text-sm mt-1">Personal Alert & Reminder System</p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" required value={form.name} onChange={set('name')} placeholder="John Doe" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required value={form.password} onChange={set('password')} placeholder="••••••••" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60">
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => { setIsRegister(!isRegister); setError(''); }} className="text-indigo-600 font-medium hover:underline">
            {isRegister ? 'Sign In' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
};
export default Login;
EOF

# ── src/components/AppLayout.jsx ─────────────────────────────────
cat > task-guardian-main/src/components/AppLayout.jsx << 'EOF'
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/tasks', label: 'Tasks', icon: '✅' },
  { path: '/reminders', label: 'Reminders', icon: '⏰' },
  { path: '/notifications', label: 'Notifications', icon: '🔔' },
  { path: '/emergency-contacts', label: 'Emergency Contacts', icon: '📞' },
];

const AppLayout = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2"><span className="text-2xl">🛡️</span><span className="text-xl font-bold text-indigo-600">Guardian</span></div>
          <p className="text-xs text-gray-500 mt-1">Personal Alert System</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ path, label, icon }) => (
            <Link key={path} to={path} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${pathname === path ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}>
              <span>{icon}</span>{label}
            </Link>
          ))}
          {user.role === 'admin' && (
            <Link to="/admin" className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition mt-4 ${pathname.startsWith('/admin') ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              <span>⚙️</span> Admin Panel
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">{user.name?.[0]?.toUpperCase()}</div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full text-sm text-red-500 hover:text-red-700 hover:bg-red-50 py-2 rounded-lg transition">Sign Out</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
};
export default AppLayout;
EOF

# ── src/components/AdminLayout.jsx ───────────────────────────────
cat > task-guardian-main/src/components/AdminLayout.jsx << 'EOF'
import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const adminNav = [
  { path: '/admin', label: 'Dashboard', icon: '📊' },
  { path: '/admin/users', label: 'Users', icon: '👥' },
  { path: '/admin/alerts', label: 'Alerts', icon: '🔔' },
  { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

const AdminLayout = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-purple-900 text-white flex flex-col">
        <div className="p-6 border-b border-purple-800">
          <div className="flex items-center gap-2"><span className="text-2xl">🛡️</span><span className="text-xl font-bold">Guardian</span></div>
          <span className="text-xs text-purple-300 mt-1 block">Admin Panel</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {adminNav.map(({ path, label, icon }) => (
            <Link key={path} to={path} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${pathname === path ? 'bg-purple-700 text-white' : 'text-purple-200 hover:bg-purple-800'}`}>
              <span>{icon}</span>{label}
            </Link>
          ))}
          <Link to="/" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-purple-300 hover:bg-purple-800 mt-4">← Back to App</Link>
        </nav>
        <div className="p-4 border-t border-purple-800">
          <p className="text-sm text-purple-200 truncate">{user.name}</p>
          <button onClick={logout} className="text-xs text-purple-400 hover:text-red-300 mt-1 transition">Sign Out</button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
};
export default AdminLayout;
EOF

# ── src/pages/Dashboard.jsx ───────────────────────────────────────
cat > task-guardian-main/src/pages/Dashboard.jsx << 'EOF'
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ icon, label, value, color, to }) => (
  <Link to={to} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition block">
    <div className="flex items-center justify-between">
      <div><p className="text-sm text-gray-500 mb-1">{label}</p><p className={`text-3xl font-bold ${color}`}>{value ?? '—'}</p></div>
      <span className="text-3xl">{icon}</span>
    </div>
  </Link>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardAPI.getStats().then(d => setStats(d.data)).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 mt-1">Here's what's happening today.</p>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 h-28 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/2 mb-3" /><div className="h-8 bg-gray-200 rounded w-1/4" /></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard icon="📋" label="Total Tasks"          value={stats?.totalTasks}           color="text-indigo-600" to="/tasks" />
          <StatCard icon="✅" label="Completed Tasks"      value={stats?.completedTasks}        color="text-green-600"  to="/tasks" />
          <StatCard icon="⏳" label="Pending Tasks"        value={stats?.pendingTasks}          color="text-yellow-600" to="/tasks" />
          <StatCard icon="⏰" label="Active Reminders"     value={stats?.activeReminders}       color="text-blue-600"   to="/reminders" />
          <StatCard icon="🔔" label="Unread Notifications" value={stats?.unreadNotifications}   color="text-red-500"    to="/notifications" />
          <StatCard icon="📞" label="Emergency Contacts"   value={stats?.emergencyContacts}     color="text-purple-600" to="/emergency-contacts" />
        </div>
      )}
      <div className="mt-10 bg-indigo-50 border border-indigo-100 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-indigo-800 mb-2">📧 Email Notifications Active</h2>
        <p className="text-sm text-indigo-600">Guardian automatically sends email reminders, task due alerts, and birthday wishes!</p>
      </div>
    </div>
  );
};
export default Dashboard;
EOF

# ── src/pages/Tasks.jsx ───────────────────────────────────────────
cat > task-guardian-main/src/pages/Tasks.jsx << 'EOF'
import { useEffect, useState } from 'react';
import { tasksAPI } from '../services/api';

const priorityColor = { low: 'text-green-600 bg-green-50', medium: 'text-yellow-600 bg-yellow-50', high: 'text-red-600 bg-red-50' };
const statusColor   = { pending: 'text-gray-600 bg-gray-100', 'in-progress': 'text-blue-600 bg-blue-50', completed: 'text-green-700 bg-green-50' };
const empty = { title: '', description: '', priority: 'medium', status: 'pending', dueDate: '' };

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const load = () => { setLoading(true); tasksAPI.getAll().then(d => setTasks(d.data)).catch(e => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm(empty); setEditId(null); setShowForm(true); };
  const openEdit = (t) => { setForm({ title: t.title, description: t.description, priority: t.priority, status: t.status, dueDate: t.dueDate ? t.dueDate.slice(0,16) : '' }); setEditId(t._id); setShowForm(true); };
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { if (editId) await tasksAPI.update(editId, form); else await tasksAPI.create(form); setShowForm(false); load(); }
    catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const handleDelete = async (id) => { if (!confirm('Delete?')) return; await tasksAPI.delete(id).catch(e => setError(e.message)); load(); };
  const toggleStatus = async (t) => { await tasksAPI.update(t._id, { status: t.status === 'completed' ? 'pending' : 'completed' }).catch(e => setError(e.message)); load(); };
  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-800">Tasks</h1><p className="text-gray-500 text-sm mt-1">{tasks.length} total tasks</p></div>
        <button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">+ Add Task</button>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      <div className="flex gap-2 mb-6">
        {['all','pending','in-progress','completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition ${filter===f ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{f}</button>
        ))}
      </div>
      {loading ? <div className="space-y-3">{Array(3).fill(0).map((_,i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-gray-100"/>)}</div>
       : filtered.length === 0 ? <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">✅</div><p>No tasks found. Add one!</p></div>
       : <div className="space-y-3">{filtered.map(t => (
          <div key={t._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
            <input type="checkbox" checked={t.status==='completed'} onChange={() => toggleStatus(t)} className="mt-1 w-4 h-4 accent-indigo-600 cursor-pointer"/>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`font-medium text-gray-800 ${t.status==='completed' ? 'line-through text-gray-400' : ''}`}>{t.title}</p>
                <div className="flex gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${priorityColor[t.priority]}`}>{t.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusColor[t.status]}`}>{t.status}</span>
                </div>
              </div>
              {t.description && <p className="text-sm text-gray-500 mt-1">{t.description}</p>}
              {t.dueDate && <p className="text-xs text-gray-400 mt-1">📅 Due: {new Date(t.dueDate).toLocaleString()}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => openEdit(t)} className="text-sm text-blue-600 hover:underline">Edit</button>
              <button onClick={() => handleDelete(t._id)} className="text-sm text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}</div>}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">{editId ? 'Edit Task' : 'New Task'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input required value={form.title} onChange={set('title')} placeholder="Task title" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={set('description')} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label><select value={form.priority} onChange={set('priority')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">{['low','medium','high'].map(p=><option key={p} value={p}>{p}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={form.status} onChange={set('status')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">{['pending','in-progress','completed'].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date & Time</label><input type="datetime-local" value={form.dueDate} onChange={set('dueDate')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <p className="text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">📧 You'll get an email 1 hour before the due date!</p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">{saving ? 'Saving...' : editId ? 'Update' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Tasks;
EOF

# ── src/pages/Reminders.jsx ───────────────────────────────────────
cat > task-guardian-main/src/pages/Reminders.jsx << 'EOF'
import { useEffect, useState } from 'react';
import { remindersAPI } from '../services/api';

const empty = { title: '', description: '', dateTime: '', repeat: 'none' };

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => { setLoading(true); remindersAPI.getAll().then(d => setReminders(d.data)).catch(e => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm(empty); setEditId(null); setShowForm(true); };
  const openEdit = (r) => { setForm({ title: r.title, description: r.description, dateTime: r.dateTime?.slice(0,16)||'', repeat: r.repeat }); setEditId(r._id); setShowForm(true); };
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { if (editId) await remindersAPI.update(editId, form); else await remindersAPI.create(form); setShowForm(false); load(); }
    catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const handleDelete = async (id) => { if (!confirm('Delete?')) return; await remindersAPI.delete(id).catch(e => setError(e.message)); load(); };
  const isPast = dt => new Date(dt) < new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-800">Reminders</h1><p className="text-gray-500 text-sm mt-1">Email reminders sent at scheduled time</p></div>
        <button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">+ Add Reminder</button>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      {loading ? <div className="space-y-3">{Array(3).fill(0).map((_,i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-gray-100"/>)}</div>
       : reminders.length === 0 ? <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">⏰</div><p>No reminders yet!</p></div>
       : <div className="space-y-3">{reminders.map(r => (
          <div key={r._id} className={`bg-white rounded-xl border shadow-sm p-5 ${isPast(r.dateTime) ? 'border-gray-100 opacity-70' : 'border-indigo-100'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-800">{r.title}</p>
                  {r.emailSent && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">✅ Email sent</span>}
                  {r.repeat !== 'none' && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize">🔁 {r.repeat}</span>}
                </div>
                {r.description && <p className="text-sm text-gray-500 mt-1">{r.description}</p>}
                <p className="text-xs text-gray-400 mt-2">📅 {new Date(r.dateTime).toLocaleString()}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(r)} className="text-sm text-blue-600 hover:underline">Edit</button>
                <button onClick={() => handleDelete(r._id)} className="text-sm text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}</div>}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">{editId ? 'Edit Reminder' : 'New Reminder'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input required value={form.title} onChange={set('title')} placeholder="Reminder title" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={set('description')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label><input required type="datetime-local" value={form.dateTime} onChange={set('dateTime')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Repeat</label><select value={form.repeat} onChange={set('repeat')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">{['none','daily','weekly','monthly'].map(r=><option key={r} value={r}>{r}</option>)}</select></div>
              <p className="text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">📧 An email will be sent at exactly the scheduled time!</p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">{saving ? 'Saving...' : editId ? 'Update' : 'Create Reminder'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Reminders;
EOF

# ── src/pages/Notifications.jsx ───────────────────────────────────
cat > task-guardian-main/src/pages/Notifications.jsx << 'EOF'
import { useEffect, useState } from 'react';
import { notificationsAPI } from '../services/api';

const typeStyle = {
  info:    { bg: 'bg-blue-50',   border: 'border-blue-200',   icon: 'ℹ️',  text: 'text-blue-800'   },
  warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '⚠️', text: 'text-yellow-800' },
  success: { bg: 'bg-green-50',  border: 'border-green-200',  icon: '✅',  text: 'text-green-800'  },
  error:   { bg: 'bg-red-50',    border: 'border-red-200',    icon: '❌',  text: 'text-red-800'    },
};
const empty = { title: '', message: '', type: 'info' };

const Notifications = () => {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => { setLoading(true); notificationsAPI.getAll().then(d => setNotifs(d.data)).catch(e => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await notificationsAPI.create(form); setShowForm(false); setForm(empty); load(); }
    catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const markRead = async (id) => { await notificationsAPI.markRead(id).catch(e => setError(e.message)); load(); };
  const handleDelete = async (id) => { if (!confirm('Delete?')) return; await notificationsAPI.delete(id).catch(e => setError(e.message)); load(); };
  const markAllRead = async () => { await Promise.all(notifs.filter(n => !n.isRead).map(n => notificationsAPI.markRead(n._id))); load(); };
  const unreadCount = notifs.filter(n => !n.isRead).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-800">Notifications</h1><p className="text-gray-500 text-sm mt-1">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p></div>
        <div className="flex gap-2">
          {unreadCount > 0 && <button onClick={markAllRead} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Mark all read</button>}
          <button onClick={() => { setShowForm(true); setForm(empty); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">+ Add Notification</button>
        </div>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      {loading ? <div className="space-y-3">{Array(3).fill(0).map((_,i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-gray-100"/>)}</div>
       : notifs.length === 0 ? <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">🔔</div><p>No notifications yet.</p></div>
       : <div className="space-y-3">{notifs.map(n => { const s = typeStyle[n.type]||typeStyle.info; return (
          <div key={n._id} className={`rounded-xl border p-5 transition ${s.bg} ${s.border} ${n.isRead ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-xl mt-0.5">{s.icon}</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-semibold ${s.text}`}>{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 bg-indigo-600 rounded-full inline-block"/>}
                    {n.emailSent && <span className="text-xs bg-white border border-green-200 text-green-700 px-2 py-0.5 rounded-full">📧 Emailed</span>}
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {!n.isRead && <button onClick={() => markRead(n._id)} className="text-xs text-indigo-600 hover:underline">Mark read</button>}
                <button onClick={() => handleDelete(n._id)} className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ); })}</div>}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-5">New Notification</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input required value={form.title} onChange={set('title')} placeholder="Notification title" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Message *</label><textarea required value={form.message} onChange={set('message')} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label><select value={form.type} onChange={set('type')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">{['info','warning','success','error'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
              <p className="text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">📧 An email will be sent immediately!</p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">{saving ? 'Sending...' : 'Create & Send Email'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Notifications;
EOF

# ── src/pages/EmergencyContacts.jsx ──────────────────────────────
cat > task-guardian-main/src/pages/EmergencyContacts.jsx << 'EOF'
import { useEffect, useState } from 'react';
import { contactsAPI } from '../services/api';

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const empty = { name: '', phone: '', email: '', relationship: '', birthdayMonth: '', birthdayDay: '' };

const EmergencyContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => { setLoading(true); contactsAPI.getAll().then(d => setContacts(d.data)).catch(e => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm(empty); setEditId(null); setShowForm(true); };
  const openEdit = (c) => { setForm({ name: c.name, phone: c.phone||'', email: c.email||'', relationship: c.relationship||'', birthdayMonth: c.birthdayMonth||'', birthdayDay: c.birthdayDay||'' }); setEditId(c._id); setShowForm(true); };
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const p = { ...form, birthdayMonth: form.birthdayMonth ? Number(form.birthdayMonth) : undefined, birthdayDay: form.birthdayDay ? Number(form.birthdayDay) : undefined };
      if (editId) await contactsAPI.update(editId, p); else await contactsAPI.create(p);
      setShowForm(false); load();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const handleDelete = async (id) => { if (!confirm('Delete?')) return; await contactsAPI.delete(id).catch(e => setError(e.message)); load(); };
  const isBirthdayToday = c => { if (!c.birthdayMonth || !c.birthdayDay) return false; const n = new Date(); return c.birthdayMonth === n.getMonth()+1 && c.birthdayDay === n.getDate(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-800">Emergency Contacts</h1><p className="text-gray-500 text-sm mt-1">Birthday wishes sent automatically at 8 AM</p></div>
        <button onClick={openNew} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">+ Add Contact</button>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array(3).fill(0).map((_,i) => <div key={i} className="h-40 bg-white rounded-xl animate-pulse border border-gray-100"/>)}</div>
       : contacts.length === 0 ? <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">📞</div><p>No contacts yet!</p></div>
       : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{contacts.map(c => (
          <div key={c._id} className={`bg-white rounded-xl border shadow-sm p-5 ${isBirthdayToday(c) ? 'border-purple-300 ring-2 ring-purple-100' : 'border-gray-100'}`}>
            {isBirthdayToday(c) && <div className="bg-purple-50 text-purple-700 text-xs font-medium px-3 py-1 rounded-full mb-3 inline-block">🎂 Birthday Today!</div>}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">{c.name[0].toUpperCase()}</div>
              <div><p className="font-semibold text-gray-800">{c.name}</p>{c.relationship && <p className="text-xs text-gray-500">{c.relationship}</p>}</div>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              {c.phone && <p>📞 {c.phone}</p>}
              {c.email && <p>📧 {c.email}</p>}
              {c.birthdayMonth && c.birthdayDay && <p>🎂 {months[c.birthdayMonth-1]} {c.birthdayDay}</p>}
            </div>
            <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
              <button onClick={() => openEdit(c)} className="text-sm text-blue-600 hover:underline">Edit</button>
              <button onClick={() => handleDelete(c._id)} className="text-sm text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}</div>}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-5">{editId ? 'Edit Contact' : 'New Contact'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input required value={form.name} onChange={set('name')} placeholder="John Doe" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={set('email')} placeholder="contact@email.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label><input value={form.relationship} onChange={set('relationship')} placeholder="Friend, Parent, Doctor" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">🎂 Birthday (optional)</label>
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.birthdayMonth} onChange={set('birthdayMonth')} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Month</option>{months.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select>
                  <input type="number" min="1" max="31" value={form.birthdayDay} onChange={set('birthdayDay')} placeholder="Day" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                </div>
              </div>
              <p className="text-xs text-purple-700 bg-purple-50 px-3 py-2 rounded-lg">🎂 Guardian will email you a birthday reminder every year at 8 AM!</p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-60">{saving ? 'Saving...' : editId ? 'Update' : 'Add Contact'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default EmergencyContacts;
EOF

# ── src/pages/admin/AdminDashboard.jsx ───────────────────────────
cat > task-guardian-main/src/pages/admin/AdminDashboard.jsx << 'EOF'
import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { adminAPI.getStats().then(d => setStats(d.data)).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  const cards = [{ label:'Total Users', value:stats?.userCount, icon:'👥', color:'text-indigo-600' }, { label:'Total Tasks', value:stats?.taskCount, icon:'✅', color:'text-green-600' }, { label:'Total Reminders', value:stats?.reminderCount, icon:'⏰', color:'text-blue-600' }];
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {cards.map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6"><div className="flex justify-between items-center"><div><p className="text-sm text-gray-500">{label}</p><p className={`text-3xl font-bold mt-1 ${color}`}>{loading ? '—' : value}</p></div><span className="text-3xl">{icon}</span></div></div>
        ))}
      </div>
    </div>
  );
};
export default AdminDashboard;
EOF

# ── src/pages/admin/AdminUsers.jsx ───────────────────────────────
cat > task-guardian-main/src/pages/admin/AdminUsers.jsx << 'EOF'
import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = () => { setLoading(true); adminAPI.getUsers().then(d => setUsers(d.data)).catch(e => setError(e.message)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const toggle = async (id) => { await adminAPI.toggleUser(id).catch(e => setError(e.message)); load(); };
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Users</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100"><tr>{['Name','Email','Role','Status','Action'].map(h => <th key={h} className="text-left px-5 py-3 text-gray-600 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-800">{u.name}</td>
                <td className="px-5 py-3 text-gray-500">{u.email}</td>
                <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${u.role==='admin' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span></td>
                <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{u.isActive ? 'Active' : 'Disabled'}</span></td>
                <td className="px-5 py-3"><button onClick={() => toggle(u._id)} className={`text-xs font-medium px-3 py-1 rounded-lg transition ${u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>{u.isActive ? 'Disable' : 'Enable'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AdminUsers;
EOF

# ── src/pages/admin/AdminAlerts.jsx ──────────────────────────────
cat > task-guardian-main/src/pages/admin/AdminAlerts.jsx << 'EOF'
const AdminAlerts = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-800 mb-6">System Alerts</h1>
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
      {[
        { icon:'✅', label:'Reminder cron',     desc:'Runs every minute — sends emails for due reminders' },
        { icon:'✅', label:'Task due cron',      desc:'Runs every 10 minutes — alerts 1 hour before due date' },
        { icon:'✅', label:'Birthday cron',      desc:'Runs daily at 8 AM — sends birthday wish emails' },
        { icon:'✅', label:'Welcome email',      desc:'Sent immediately on user registration' },
        { icon:'✅', label:'Notification email', desc:'Sent immediately when a notification is created' },
      ].map(({ icon, label, desc }) => (
        <div key={label} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
          <span className="text-xl text-green-600">{icon}</span>
          <div><p className="font-medium text-gray-800">{label}</p><p className="text-sm text-gray-500">{desc}</p></div>
        </div>
      ))}
    </div>
  </div>
);
export default AdminAlerts;
EOF

# ── src/pages/admin/AdminSettings.jsx ────────────────────────────
cat > task-guardian-main/src/pages/admin/AdminSettings.jsx << 'EOF'
const AdminSettings = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-semibold text-gray-800 mb-4">Email Configuration (set in .env)</h2>
      <div className="space-y-3 text-sm text-gray-600">
        {['EMAIL_HOST','EMAIL_PORT','EMAIL_USER','EMAIL_PASS','EMAIL_FROM'].map(k => (
          <div key={k} className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-lg font-mono">
            <span className="text-indigo-600">{k}</span>
            <span className="text-gray-400">— set in guardian-backend/.env</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-4">Use a Gmail App Password. Enable 2FA first, then generate an App Password from Google account security settings.</p>
    </div>
  </div>
);
export default AdminSettings;
EOF

# ── src/pages/NotFound.jsx ────────────────────────────────────────
cat > task-guardian-main/src/pages/NotFound.jsx << 'EOF'
import { Link } from 'react-router-dom';
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="text-7xl mb-4">🛡️</div>
      <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
      <p className="text-gray-500 mb-6">Page not found</p>
      <Link to="/" className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition">Go Home</Link>
    </div>
  </div>
);
export default NotFound;
EOF

echo "✅ Frontend files created!"

# ═══════════════════════════════════════════════════════════════════
# GIT PUSH
# ═══════════════════════════════════════════════════════════════════
echo ""
echo "🚀 Pushing to GitHub..."
git add .
git commit -m "feat: complete Guardian app - added nodemailer, cron jobs, FE/BE integration"
git push origin main

echo ""
echo "🎉 DONE! All files pushed to GitHub!"
echo "   Repo: https://github.com/ramvipul96/college-project"
echo ""
echo "📋 Next steps:"
echo "   1. cd guardian-backend && cp .env.example .env (fill in your values)"
echo "   2. cd guardian-backend && npm install && npm run dev"
echo "   3. cd task-guardian-main && npm install && npm run dev"
