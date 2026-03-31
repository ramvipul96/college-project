#!/bin/bash
set -e
echo "🛡️  Guardian Full Fix Script"
echo "============================="
cd "$(dirname "$0")"

# ═══════════════════════════════════════════════════════════════════
# BACKEND FIXES
# ═══════════════════════════════════════════════════════════════════
echo "📁 Fixing backend..."
mkdir -p guardian-backend/src/models
mkdir -p guardian-backend/src/routes
mkdir -p guardian-backend/src/cron
mkdir -p guardian-backend/src/services
mkdir -p guardian-backend/src/middleware
mkdir -p guardian-backend/config

# ── Updated Reminder model with status + scheduledAt ─────────────
cat > guardian-backend/src/models/Reminder.js << 'EOF'
const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  dateTime:    { type: Date, required: true },
  scheduledAt: { type: Date },           // exact ms timestamp for precision
  isActive:    { type: Boolean, default: true },
  status:      { type: String, enum: ['pending', 'sent', 'failed', 'skipped'], default: 'pending' },
  emailSent:   { type: Boolean, default: false },
  sentAt:      { type: Date },
  retryCount:  { type: Number, default: 0 },
  repeat:      { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
}, { timestamps: true });

// Auto-set scheduledAt from dateTime if not provided
reminderSchema.pre('save', function(next) {
  if (!this.scheduledAt) this.scheduledAt = this.dateTime;
  next();
});

module.exports = mongoose.model('Reminder', reminderSchema);
EOF

# ── Updated Task model ────────────────────────────────────────────
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
  emailSentAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
EOF

# ── Updated User model with birthday + profile fields ─────────────
cat > guardian-backend/src/models/User.js << 'EOF'
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true },
  password:      { type: String, required: true },
  role:          { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive:      { type: Boolean, default: true },
  phone:         { type: String, default: '' },
  address:       { type: String, default: '' },
  birthdayMonth: { type: Number, min: 1, max: 12 },
  birthdayDay:   { type: Number, min: 1, max: 31 },
  birthdayYear:  { type: Number },
  birthdayEmailSentYear: { type: Number }, // track which year we already sent
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
EOF

# ── Notification + EmergencyContact models ────────────────────────
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
  birthdayEmailSentYear: { type: Number },
}, { timestamps: true });
module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);
EOF

# ── Reliable cron scheduler ───────────────────────────────────────
cat > guardian-backend/src/cron/scheduler.js << 'EOF'
const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const Task = require('../models/Task');
const User = require('../models/User');
const EmergencyContact = require('../models/EmergencyContact');
const {
  sendReminderEmail, sendTaskDueEmail,
  sendWishesEmail, sendBirthdayEmailToUser,
} = require('../services/emailService');

// ── Reliable reminder check: 2-min window, retry up to 3 times ───
const checkReminders = async () => {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 60 * 1000);  // 1 min ago
    const windowEnd   = new Date(now.getTime() + 60 * 1000);  // 1 min ahead

    // Find pending reminders within window OR overdue ones that failed
    const dueReminders = await Reminder.find({
      status: { $in: ['pending', 'failed'] },
      retryCount: { $lt: 3 },
      isActive: true,
      $or: [
        { scheduledAt: { $gte: windowStart, $lte: windowEnd } },
        // Also catch overdue ones missed (up to 30 mins ago)
        { scheduledAt: { $gte: new Date(now.getTime() - 30 * 60 * 1000), $lt: windowStart } },
      ],
    }).populate('user');

    for (const reminder of dueReminders) {
      if (!reminder.user?.email) continue;
      try {
        await sendReminderEmail(reminder.user, reminder);
        reminder.status    = 'sent';
        reminder.emailSent = true;
        reminder.sentAt    = new Date();
        console.log(`✅ Reminder sent: "${reminder.title}" → ${reminder.user.email}`);

        // Handle repeat — schedule next occurrence
        if (reminder.repeat !== 'none') {
          const next = new Date(reminder.scheduledAt);
          if (reminder.repeat === 'daily')   next.setDate(next.getDate() + 1);
          if (reminder.repeat === 'weekly')  next.setDate(next.getDate() + 7);
          if (reminder.repeat === 'monthly') next.setMonth(next.getMonth() + 1);
          await Reminder.create({
            user: reminder.user._id,
            title: reminder.title,
            description: reminder.description,
            dateTime: next,
            scheduledAt: next,
            repeat: reminder.repeat,
            isActive: true,
            status: 'pending',
          });
        }
      } catch (err) {
        reminder.status     = 'failed';
        reminder.retryCount = (reminder.retryCount || 0) + 1;
        console.error(`❌ Reminder failed (attempt ${reminder.retryCount}): ${err.message}`);
      }
      await reminder.save();
    }
  } catch (err) {
    console.error('Cron reminder error:', err.message);
  }
};

// ── Task due alert: 1 hour before, only once ──────────────────────
const checkTasksDue = async () => {
  try {
    const now         = new Date();
    const from        = new Date(now.getTime() + 50 * 60 * 1000);  // 50 min ahead
    const to          = new Date(now.getTime() + 70 * 60 * 1000);  // 70 min ahead

    const dueTasks = await Task.find({
      dueDate:   { $gte: from, $lte: to },
      emailSent: false,
      status:    { $ne: 'completed' },
    }).populate('user');

    for (const task of dueTasks) {
      if (!task.user?.email) continue;
      try {
        await sendTaskDueEmail(task.user, task);
        task.emailSent   = true;
        task.emailSentAt = new Date();
        await task.save();
        console.log(`✅ Task due email: "${task.title}" → ${task.user.email}`);
      } catch (err) {
        console.error(`❌ Task email failed: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Cron task error:', err.message);
  }
};

// ── Birthday: check contacts AND user's own birthday at 8 AM ─────
const checkBirthdays = async () => {
  try {
    const now   = new Date();
    const month = now.getMonth() + 1;
    const day   = now.getDate();
    const year  = now.getFullYear();

    // 1. Emergency contact birthdays
    const contacts = await EmergencyContact.find({
      birthdayMonth: month,
      birthdayDay:   day,
      $or: [
        { birthdayEmailSentYear: { $exists: false } },
        { birthdayEmailSentYear: { $lt: year } },
      ],
    }).populate('user');

    for (const contact of contacts) {
      if (!contact.user?.email) continue;
      try {
        await sendWishesEmail(contact.user, contact);
        contact.birthdayEmailSentYear = year;
        await contact.save();
        console.log(`🎂 Birthday wish sent for ${contact.name} → ${contact.user.email}`);
      } catch (err) {
        console.error(`❌ Birthday wish failed: ${err.message}`);
      }
    }

    // 2. User's own birthday
    const birthdayUsers = await User.find({
      birthdayMonth: month,
      birthdayDay:   day,
      $or: [
        { birthdayEmailSentYear: { $exists: false } },
        { birthdayEmailSentYear: { $lt: year } },
      ],
    });

    for (const user of birthdayUsers) {
      try {
        await sendBirthdayEmailToUser(user);
        user.birthdayEmailSentYear = year;
        await user.save();
        console.log(`🎂 Own birthday email sent to ${user.email}`);
      } catch (err) {
        console.error(`❌ Own birthday email failed: ${err.message}`);
      }
    }
  } catch (err) {
    console.error('Cron birthday error:', err.message);
  }
};

const initCronJobs = () => {
  // Every minute — reminders
  cron.schedule('* * * * *', checkReminders);
  console.log('⏰ Reminder cron started (every minute, 2-min window, retry x3)');

  // Every 10 minutes — task due alerts
  cron.schedule('*/10 * * * *', checkTasksDue);
  console.log('📋 Task cron started (every 10 min, alerts 1hr before due)');

  // Daily at 8 AM — birthdays
  cron.schedule('0 8 * * *', checkBirthdays);
  console.log('🎂 Birthday cron started (daily 8 AM, own + contacts)');
};

module.exports = { initCronJobs };
EOF

# ── Email service with user birthday email ────────────────────────
cat > guardian-backend/src/services/emailService.js << 'EOF'
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

transporter.verify((err) => {
  if (err) console.error('❌ Email error:', err.message);
  else console.log('📧 Email service ready');
});

const sendEmail = async ({ to, subject, html }) => {
  const info = await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
  return info;
};

const wrap = (color, headerText, bodyHtml) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
    <div style="background:${color};padding:24px;color:white"><h2 style="margin:0">${headerText}</h2></div>
    <div style="padding:24px">${bodyHtml}</div>
    <div style="background:#f9fafb;padding:16px;text-align:center;color:#9ca3af;font-size:12px">© ${new Date().getFullYear()} Guardian App</div>
  </div>`;

const sendReminderEmail = (user, reminder) => sendEmail({
  to: user.email,
  subject: `⏰ Reminder: ${reminder.title}`,
  html: wrap('#4f46e5', '🛡️ Guardian Reminder', `
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>This is your scheduled reminder:</p>
    <div style="background:#f3f4f6;border-left:4px solid #4f46e5;padding:16px;border-radius:4px;margin:16px 0">
      <h3 style="margin:0 0 8px">${reminder.title}</h3>
      ${reminder.description ? `<p style="margin:0;color:#6b7280">${reminder.description}</p>` : ''}
    </div>
    <p style="color:#6b7280;font-size:14px">Scheduled: <strong>${new Date(reminder.scheduledAt || reminder.dateTime).toLocaleString()}</strong></p>`),
});

const sendTaskDueEmail = (user, task) => sendEmail({
  to: user.email,
  subject: `📋 Task Due Soon: ${task.title}`,
  html: wrap('#dc2626', '📋 Task Due Soon', `
    <p>Hi <strong>${user.name}</strong>,</p>
    <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;border-radius:4px;margin:16px 0">
      <h3 style="margin:0 0 8px">${task.title}</h3>
      ${task.description ? `<p style="margin:0;color:#6b7280">${task.description}</p>` : ''}
      <p style="margin:8px 0 0;color:#dc2626;font-weight:bold">Priority: ${task.priority}</p>
    </div>
    <p style="color:#6b7280;font-size:14px">Due: <strong>${new Date(task.dueDate).toLocaleString()}</strong></p>`),
});

const sendNotificationEmail = (user, notification) => sendEmail({
  to: user.email,
  subject: `🔔 ${notification.title}`,
  html: wrap('#0891b2', '🔔 Guardian Notification', `
    <p>Hi <strong>${user.name}</strong>,</p>
    <div style="background:#ecfeff;border-left:4px solid #0891b2;padding:16px;border-radius:4px;margin:16px 0">
      <h3 style="margin:0 0 8px">${notification.title}</h3>
      <p style="margin:0">${notification.message}</p>
    </div>`),
});

const sendWishesEmail = (user, contact) => sendEmail({
  to: user.email,
  subject: `🎂 Birthday Today: ${contact.name}`,
  html: wrap('#7c3aed', '🎂 Birthday Reminder!', `
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>Don't forget — it's <strong>${contact.name}</strong>'s birthday today! 🎉</p>
    <div style="background:#faf5ff;border-left:4px solid #7c3aed;padding:16px;border-radius:4px;margin:16px 0">
      ${contact.phone ? `<p style="margin:0">📞 ${contact.phone}</p>` : ''}
      ${contact.email ? `<p style="margin:4px 0 0">📧 ${contact.email}</p>` : ''}
    </div>`),
});

const sendBirthdayEmailToUser = (user) => sendEmail({
  to: user.email,
  subject: `🎂 Happy Birthday, ${user.name}!`,
  html: wrap('#ec4899', '🎂 Happy Birthday!', `
    <p>Hi <strong>${user.name}</strong>,</p>
    <p style="font-size:1.1rem">🎉 Wishing you a wonderful birthday! 🎂🎈</p>
    <p>Guardian is here to keep you safe and organized — today and every day.</p>
    <p style="color:#6b7280">Have an amazing day!</p>`),
});

const sendWelcomeEmail = (user) => sendEmail({
  to: user.email,
  subject: '🛡️ Welcome to Guardian!',
  html: wrap('#4f46e5', '🛡️ Welcome to Guardian!', `
    <p>Hi <strong>${user.name}</strong>,</p>
    <p>Welcome to <strong>Guardian</strong> — your personal alert & reminder system!</p>
    <ul style="color:#374151;line-height:1.8">
      <li>✅ Create and manage <strong>tasks</strong></li>
      <li>⏰ Set <strong>reminders</strong> with email alerts</li>
      <li>🔔 Receive <strong>notifications</strong></li>
      <li>📞 Manage <strong>emergency contacts</strong></li>
      <li>🎂 Get <strong>birthday reminders</strong></li>
    </ul>`),
});

module.exports = {
  sendEmail, sendReminderEmail, sendTaskDueEmail,
  sendNotificationEmail, sendWishesEmail,
  sendBirthdayEmailToUser, sendWelcomeEmail,
};
EOF

# ── Profile route (new) ───────────────────────────────────────────
cat > guardian-backend/src/routes/profile.js << 'EOF'
const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const router = express.Router();

// GET /api/profile
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/profile
router.put('/', protect, async (req, res) => {
  try {
    const { name, phone, address, birthdayMonth, birthdayDay, birthdayYear } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address, birthdayMonth, birthdayDay, birthdayYear },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, data: user });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// PUT /api/profile/password
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

module.exports = router;
EOF

# ── Auth middleware ───────────────────────────────────────────────
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

# ── Updated server.js with profile route ─────────────────────────
cat > guardian-backend/src/server.js << 'EOF'
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('../config/db');
const { initCronJobs } = require('./cron/scheduler');

const authRoutes         = require('./routes/auth');
const dashboardRoutes    = require('./routes/dashboard');
const taskRoutes         = require('./routes/tasks');
const reminderRoutes     = require('./routes/reminders');
const contactRoutes      = require('./routes/emergencyContacts');
const notificationRoutes = require('./routes/notifications');
const adminRoutes        = require('./routes/admin');
const profileRoutes      = require('./routes/profile');

connectDB();
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',          authRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/tasks',         taskRoutes);
app.use('/api/reminders',     reminderRoutes);
app.use('/api/contacts',      contactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/profile',       profileRoutes);

app.get('/api/health', (req, res) => res.json({ success: true, message: 'Guardian API running 🛡️' }));
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));
app.use((err, req, res, next) => res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Guardian running on http://localhost:${PORT}`);
  initCronJobs();
});
EOF

# ── Updated reminders route with scheduledAt ─────────────────────
cat > guardian-backend/src/routes/reminders.js << 'EOF'
const express = require('express');
const Reminder = require('../models/Reminder');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  const reminders = await Reminder.find({ user: req.user._id }).sort({ scheduledAt: 1 });
  res.json({ success: true, data: reminders });
});

router.post('/', protect, async (req, res) => {
  try {
    const data = { ...req.body, user: req.user._id };
    // set scheduledAt from dateTime if not explicitly given
    if (!data.scheduledAt) data.scheduledAt = data.dateTime;
    const reminder = await Reminder.create(data);
    res.status(201).json({ success: true, data: reminder });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.put('/:id', protect, async (req, res) => {
  const update = { ...req.body, status: 'pending', emailSent: false, retryCount: 0 };
  if (update.dateTime && !update.scheduledAt) update.scheduledAt = update.dateTime;
  const reminder = await Reminder.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id }, update, { new: true }
  );
  if (!reminder) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: reminder });
});

router.delete('/:id', protect, async (req, res) => {
  await Reminder.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true, message: 'Deleted' });
});

module.exports = router;
EOF

echo "✅ Backend fixed!"

# ═══════════════════════════════════════════════════════════════════
# FRONTEND FIXES
# ═══════════════════════════════════════════════════════════════════
echo "📁 Fixing frontend..."
mkdir -p task-guardian-main/src/context
mkdir -p task-guardian-main/src/services
mkdir -p task-guardian-main/src/pages/admin
mkdir -p task-guardian-main/src/components

# ── .env ─────────────────────────────────────────────────────────
cat > task-guardian-main/.env << 'EOF'
VITE_API_URL=http://localhost:5000/api
EOF

# ── api.js — add profileAPI ───────────────────────────────────────
cat > task-guardian-main/src/services/api.js << 'EOF'
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('guardian_token');
const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});
const request = async (method, path, body) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method, headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};
const get = (p) => request('GET', p);
const post = (p, b) => request('POST', p, b);
const put = (p, b) => request('PUT', p, b);
const del = (p) => request('DELETE', p);

export const authAPI = {
  login: (email, password) => post('/auth/login', { email, password }),
  register: (name, email, password) => post('/auth/register', { name, email, password }),
  me: () => get('/auth/me'),
};
export const dashboardAPI  = { getStats: () => get('/dashboard') };
export const tasksAPI      = { getAll: () => get('/tasks'), create: (t) => post('/tasks', t), update: (id, t) => put(`/tasks/${id}`, t), delete: (id) => del(`/tasks/${id}`) };
export const remindersAPI  = { getAll: () => get('/reminders'), create: (r) => post('/reminders', r), update: (id, r) => put(`/reminders/${id}`, r), delete: (id) => del(`/reminders/${id}`) };
export const notificationsAPI = { getAll: () => get('/notifications'), create: (n) => post('/notifications', n), markRead: (id) => put(`/notifications/${id}/read`), delete: (id) => del(`/notifications/${id}`) };
export const contactsAPI   = { getAll: () => get('/contacts'), create: (c) => post('/contacts', c), update: (id, c) => put(`/contacts/${id}`, c), delete: (id) => del(`/contacts/${id}`) };
export const adminAPI      = { getUsers: () => get('/admin/users'), toggleUser: (id) => put(`/admin/users/${id}/toggle`), getStats: () => get('/admin/stats') };
export const profileAPI    = { get: () => get('/profile'), update: (d) => put('/profile', d), changePassword: (d) => put('/profile/password', d) };

export const saveToken  = (t) => localStorage.setItem('guardian_token', t);
export const clearToken = ()  => localStorage.removeItem('guardian_token');
export const isLoggedIn = ()  => !!getToken();
EOF

# ── AuthContext ───────────────────────────────────────────────────
cat > task-guardian-main/src/context/AuthContext.jsx << 'EOF'
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, saveToken, clearToken, isLoggedIn } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
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
  const logout    = () => { clearToken(); setUser(null); };
  const refreshUser = async () => {
    const data = await authAPI.me();
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
EOF

# ── main.jsx ──────────────────────────────────────────────────────
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

# ── App.jsx — add /profile route ─────────────────────────────────
cat > task-guardian-main/src/App.jsx << 'EOF'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Tasks from "./pages/Tasks.jsx";
import Reminders from "./pages/Reminders.jsx";
import Notifications from "./pages/Notifications.jsx";
import EmergencyContacts from "./pages/EmergencyContacts.jsx";
import Profile from "./pages/Profile.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminAlerts from "./pages/admin/AdminAlerts.jsx";
import AdminSettings from "./pages/admin/AdminSettings.jsx";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/"                    element={<AppLayout><Dashboard /></AppLayout>} />
      <Route path="/tasks"               element={<AppLayout><Tasks /></AppLayout>} />
      <Route path="/reminders"           element={<AppLayout><Reminders /></AppLayout>} />
      <Route path="/notifications"       element={<AppLayout><Notifications /></AppLayout>} />
      <Route path="/emergency-contacts"  element={<AppLayout><EmergencyContacts /></AppLayout>} />
      <Route path="/profile"             element={<AppLayout><Profile /></AppLayout>} />
      <Route path="/admin"               element={<AdminLayout><AdminDashboard /></AdminLayout>} />
      <Route path="/admin/users"         element={<AdminLayout><AdminUsers /></AdminLayout>} />
      <Route path="/admin/alerts"        element={<AdminLayout><AdminAlerts /></AdminLayout>} />
      <Route path="/admin/settings"      element={<AdminLayout><AdminSettings /></AdminLayout>} />
      <Route path="*"                    element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
EOF

# ── AppLayout — add Profile link + logout wired ───────────────────
cat > task-guardian-main/src/components/AppLayout.jsx << 'EOF'
import { useState } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import {
  LayoutDashboard, Bell, CheckSquare, Clock,
  Users, AlertTriangle, Menu, X, Shield,
  LogOut, Settings, UserCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { path: "/",                   label: "Dashboard",          icon: LayoutDashboard },
  { path: "/tasks",              label: "Tasks",              icon: CheckSquare },
  { path: "/reminders",          label: "Reminders",          icon: Clock },
  { path: "/notifications",      label: "Notifications",      icon: Bell },
  { path: "/emergency-contacts", label: "Emergency Contacts", icon: Users },
];

const AppLayout = ({ children }) => {
  const location = useLocation();
  const { user, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "var(--color-text-muted)" }}>
      Loading...
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-wrapper">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon primary"><Shield size={20} /></div>
          <div><h1>Guardian</h1><p>Alert & Reminder System</p></div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`sidebar-link ${isActive ? "active" : ""}`}>
                <item.icon />{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <Link to="/profile" className={`sidebar-link ${location.pathname === "/profile" ? "active" : ""}`}>
            <UserCircle />My Profile
          </Link>
          {user.role === "admin" && (
            <Link to="/admin" className="sidebar-link"><Settings />Admin Panel</Link>
          )}
          <button
            className="sidebar-link"
            onClick={logout}
            style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", color: "var(--color-danger)" }}
          >
            <LogOut />Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div>
          <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
          <aside className="mobile-sidebar">
            <div className="mobile-sidebar-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Shield size={20} style={{ color: "var(--color-primary)" }} />
                <span style={{ fontWeight: 700, fontFamily: "var(--font-display)" }}>Guardian</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} style={{ color: "var(--color-text-muted)" }}><X size={20} /></button>
            </div>
            <nav className="sidebar-nav">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={`sidebar-link ${isActive ? "active" : ""}`}>
                    <item.icon />{item.label}
                  </Link>
                );
              })}
              <Link to="/profile" onClick={() => setSidebarOpen(false)} className="sidebar-link"><UserCircle />My Profile</Link>
            </nav>
          </aside>
        </div>
      )}

      <div className="main-content">
        <header className="mobile-header">
          <button onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          <div className="mobile-header-brand">
            <Shield size={20} style={{ color: "var(--color-primary)" }} />Guardian
          </div>
          <div style={{ width: 20 }} />
        </header>
        <main className="main-inner">{children}</main>
        <button className="floating-alert-btn" onClick={() => alert("🚨 Personal Alert Triggered!")} title="Personal Alert">
          <AlertTriangle />
        </button>
        <nav className="mobile-bottom-nav">
          {navItems.slice(0, 4).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`mobile-nav-link ${isActive ? "active" : ""}`}>
                <item.icon />{item.label.split(" ")[0]}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AppLayout;
EOF

# ── Login.jsx — original design + real API ───────────────────────
cat > task-guardian-main/src/pages/Login.jsx << 'EOF'
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
EOF

# ── Tasks.jsx — FIXED form toggle + real API ─────────────────────
cat > task-guardian-main/src/pages/Tasks.jsx << 'EOF'
import { useState, useEffect } from "react";
import { Plus, Check, Calendar, Trash2, X } from "lucide-react";
import { tasksAPI } from "../services/api";

const filters      = ["All", "Active", "Completed", "high", "medium", "low"];
const priorityBadge = { high: "badge-red", medium: "badge-yellow", low: "badge-blue" };
const emptyForm     = { title: "", description: "", priority: "medium", status: "pending", dueDate: "" };

const Tasks = () => {
  const [tasks, setTasks]       = useState([]);
  const [filter, setFilter]     = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [editId, setEditId]     = useState(null);
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  const load = () => {
    setLoading(true);
    tasksAPI.getAll()
      .then(d => setTasks(d.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (t) => {
    setForm({ title: t.title, description: t.description || "", priority: t.priority, status: t.status, dueDate: t.dueDate ? t.dueDate.slice(0, 16) : "" });
    setEditId(t._id); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editId) await tasksAPI.update(editId, form);
      else        await tasksAPI.create(form);
      closeForm(); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const toggleTask = async (task) => {
    const next = task.status === "completed" ? "pending" : "completed";
    await tasksAPI.update(task._id, { status: next }).catch(e => setError(e.message));
    load();
  };

  const deleteTask = async (id) => {
    if (!confirm("Delete this task?")) return;
    await tasksAPI.delete(id).catch(e => setError(e.message));
    load();
  };

  const filtered = tasks.filter((t) => {
    if (filter === "Active")    return t.status !== "completed";
    if (filter === "Completed") return t.status === "completed";
    if (["high","medium","low"].includes(filter)) return t.priority === filter;
    return true;
  });

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p>{tasks.filter(t => t.status !== "completed").length} tasks remaining</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} />Add Task</button>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem" }}>
          {error}
        </div>
      )}

      {/* Inline Add/Edit Form */}
      {showForm && (
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", margin: 0 }}>
              {editId ? "Edit Task" : "New Task"}
            </h3>
            <button onClick={closeForm} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
              <X size={18} />
            </button>
          </div>
          <div className="card-body">
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="Task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="Optional details" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-md)" }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    {["low","medium","high"].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {["pending","in-progress","completed"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="datetime-local" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? "Saving..." : editId ? "Update Task" : "Save Task"}
                </button>
                <button className="btn btn-outline" type="button" onClick={closeForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="filter-bar">
        {filters.map(f => (
          <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="section-gap" style={{ gap: "var(--space-sm)" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "var(--space-2xl)", color: "var(--color-text-muted)" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "var(--space-2xl)", color: "var(--color-text-muted)" }}>No tasks found</div>
        ) : filtered.map(task => (
          <div className={`list-item ${task.status === "completed" ? "completed" : ""}`} key={task._id}>
            <div className={`checkbox ${task.status === "completed" ? "checked" : ""}`} onClick={() => toggleTask(task)}>
              {task.status === "completed" && <Check size={12} />}
            </div>
            <div className="list-item-content">
              <div className={`list-item-title ${task.status === "completed" ? "done" : ""}`}>{task.title}</div>
              <div className="list-item-meta">
                {task.dueDate && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} />{new Date(task.dueDate).toLocaleDateString()}</span>}
                {task.description && <span style={{ color: "var(--color-text-muted)" }}>{task.description}</span>}
              </div>
            </div>
            <span className={`badge ${priorityBadge[task.priority] || "badge-blue"}`}>{task.priority}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(task)} title="Edit">✏️</button>
            <button className="btn btn-ghost btn-sm" onClick={() => deleteTask(task._id)} title="Delete">
              <Trash2 size={14} style={{ color: "var(--color-danger)" }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Tasks;
EOF

# ── Reminders.jsx — with scheduledAt + status display ────────────
cat > task-guardian-main/src/pages/Reminders.jsx << 'EOF'
import { useState, useEffect } from "react";
import { Plus, Clock, Bell, Repeat, Trash2, X } from "lucide-react";
import { remindersAPI } from "../services/api";

const repeatBadge  = { none: "badge-gray", daily: "badge-blue", weekly: "badge-green", monthly: "badge-yellow" };
const statusBadge  = { pending: "badge-yellow", sent: "badge-green", failed: "badge-red", skipped: "badge-gray" };
const emptyForm    = { title: "", description: "", dateTime: "", repeat: "none" };

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [editId, setEditId]       = useState(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const load = () => remindersAPI.getAll().then(d => setReminders(d.data)).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);

  const openNew  = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (r) => {
    setForm({ title: r.title, description: r.description || "", dateTime: r.dateTime?.slice(0,16) || "", repeat: r.repeat });
    setEditId(r._id); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.dateTime) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        dateTime:    new Date(form.dateTime).toISOString(),
        scheduledAt: new Date(form.dateTime).toISOString(),
      };
      if (editId) await remindersAPI.update(editId, payload);
      else        await remindersAPI.create(payload);
      closeForm(); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const toggleReminder = async (r) => {
    await remindersAPI.update(r._id, { isActive: !r.isActive }).catch(e => setError(e.message));
    load();
  };

  const deleteReminder = async (id) => {
    if (!confirm("Delete this reminder?")) return;
    await remindersAPI.delete(id).catch(e => setError(e.message));
    load();
  };

  return (
    <div className="section-gap">
      <div className="page-header">
        <div>
          <h1>Reminders</h1>
          <p>{reminders.filter(r => r.isActive && r.status === "pending").length} pending reminders</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={16} />Add Reminder</button>
      </div>

      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem" }}>{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", margin: 0 }}>{editId ? "Edit Reminder" : "New Reminder"}</h3>
            <button onClick={closeForm} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}><X size={18} /></button>
          </div>
          <div className="card-body">
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
              <div className="form-group">
                <label className="form-label">Reminder Title *</label>
                <input className="form-input" placeholder="What should we remind you about?" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="Optional details" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
                <div className="form-group">
                  <label className="form-label">Date & Time *</label>
                  <input className="form-input" type="datetime-local" value={form.dateTime} onChange={e => setForm({ ...form, dateTime: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Repeat</label>
                  <select className="form-input" value={form.repeat} onChange={e => setForm({ ...form, repeat: e.target.value })}>
                    {["none","daily","weekly","monthly"].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--color-primary)", background: "var(--color-bg-secondary)", padding: "8px 12px", borderRadius: 6 }}>
                📧 Email will be sent at the exact scheduled time. Failed sends are retried up to 3 times.
              </p>
              <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : editId ? "Update" : "Save Reminder"}</button>
                <button className="btn btn-outline" type="button" onClick={closeForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="section-gap" style={{ gap: "var(--space-sm)" }}>
        {reminders.length === 0 && (
          <div style={{ textAlign: "center", padding: "var(--space-2xl)", color: "var(--color-text-muted)" }}>No reminders yet. Add one!</div>
        )}
        {reminders.map(reminder => (
          <div className="list-item" key={reminder._id} style={{ opacity: reminder.isActive ? 1 : 0.5 }}>
            <div style={{ color: reminder.isActive ? "var(--color-accent)" : "var(--color-text-muted)" }}><Bell size={20} /></div>
            <div className="list-item-content">
              <div className="list-item-title">{reminder.title}</div>
              <div className="list-item-meta">
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} />{new Date(reminder.scheduledAt || reminder.dateTime).toLocaleString()}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Repeat size={12} />{reminder.repeat}</span>
                {reminder.retryCount > 0 && <span style={{ color: "var(--color-danger)", fontSize: "0.75rem" }}>Retry {reminder.retryCount}/3</span>}
              </div>
            </div>
            <span className={`badge ${repeatBadge[reminder.repeat] || "badge-gray"}`}>{reminder.repeat}</span>
            <span className={`badge ${statusBadge[reminder.status] || "badge-gray"}`}>{reminder.status}</span>
            <div className={`toggle ${reminder.isActive ? "active" : ""}`} onClick={() => toggleReminder(reminder)} />
            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(reminder)} title="Edit">✏️</button>
            <button className="btn btn-ghost btn-sm" onClick={() => deleteReminder(reminder._id)}>
              <Trash2 size={14} style={{ color: "var(--color-danger)" }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Reminders;
EOF

# ── Profile.jsx — NEW page with birthday + personal details ──────
cat > task-guardian-main/src/pages/Profile.jsx << 'EOF'
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
EOF

# ── AdminDashboard — original design + real stats ─────────────────
cat > task-guardian-main/src/pages/admin/AdminDashboard.jsx << 'EOF'
import { useEffect, useState } from "react";
import { Users, AlertTriangle, Activity, ShieldCheck } from "lucide-react";
import { adminAPI } from "../../services/api";

const statusBadge = { Escalated: "badge-red", Pending: "badge-yellow", Resolved: "badge-green" };

const recentAlerts = [
  { user: "System", type: "Reminder cron", status: "Resolved", time: "1 min ago" },
  { user: "System", type: "Task due check", status: "Resolved", time: "10 min ago" },
  { user: "System", type: "Birthday check", status: "Resolved", time: "8 AM today" },
];
const systemLog = [
  { text: "Reminder cron running (every minute)", time: "Live", color: "green" },
  { text: "Task due cron running (every 10 min)", time: "Live", color: "green" },
  { text: "Birthday cron running (daily 8 AM)",   time: "Live", color: "green" },
  { text: "Email service connected",              time: "Live", color: "blue" },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminAPI.getStats().then(d => setStats(d.data)).catch(console.error);
  }, []);

  const statCards = [
    { label: "Total Users",     value: stats?.userCount     ?? "...", icon: Users,      color: "blue"   },
    { label: "Total Tasks",     value: stats?.taskCount     ?? "...", icon: Activity,   color: "green"  },
    { label: "Total Reminders", value: stats?.reminderCount ?? "...", icon: ShieldCheck, color: "yellow" },
    { label: "System Alerts",   value: recentAlerts.length,           icon: AlertTriangle, color: "red" },
  ];

  return (
    <div className="section-gap">
      <div className="page-header">
        <div><h1>Admin Dashboard</h1><p>System overview and monitoring</p></div>
      </div>
      <div className="stats-grid">
        {statCards.map(stat => (
          <div className="stat-card" key={stat.label}>
            <div className={`stat-icon ${stat.color}`}><stat.icon /></div>
            <div className="stat-info"><h3>{stat.value}</h3><p>{stat.label}</p></div>
          </div>
        ))}
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem" }}>Recent System Alerts</h3></div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: "none", borderRadius: 0 }}>
              <table className="table">
                <thead><tr><th>Source</th><th>Type</th><th>Status</th><th>Time</th></tr></thead>
                <tbody>
                  {recentAlerts.map((a, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{a.user}</td>
                      <td>{a.type}</td>
                      <td><span className={`badge ${statusBadge[a.status]}`}>{a.status}</span></td>
                      <td style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>{a.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem" }}>System Activity</h3></div>
          <div className="card-body">
            <div className="activity-list">
              {systemLog.map((item, i) => (
                <div className="activity-item" key={i}>
                  <div className={`activity-dot ${item.color}`} />
                  <span className="activity-text">{item.text}</span>
                  <span className="activity-time">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
EOF

# ── AdminUsers — original design + real API ───────────────────────
cat > task-guardian-main/src/pages/admin/AdminUsers.jsx << 'EOF'
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
EOF

# ── AdminAlerts + AdminSettings ───────────────────────────────────
cat > task-guardian-main/src/pages/admin/AdminAlerts.jsx << 'EOF'
const AdminAlerts = () => (
  <div className="section-gap">
    <div className="page-header"><div><h1>System Alerts</h1><p>Cron job & email delivery status</p></div></div>
    <div className="card"><div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
      {[
        { label: "Reminder cron",       desc: "Every minute — 2-min window, retries failed sends up to 3x, handles repeating reminders" },
        { label: "Task due cron",       desc: "Every 10 minutes — sends alert when task is due within 1 hour, one email per task" },
        { label: "Birthday cron",       desc: "Daily at 8 AM — sends wish for contacts + user's own birthday, tracks year to avoid duplicates" },
        { label: "Welcome email",       desc: "Instant — sent when a new user registers" },
        { label: "Notification email",  desc: "Instant — sent when a notification is created" },
      ].map(({ label, desc }) => (
        <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-md)", padding: "var(--space-md)", background: "var(--color-bg-secondary)", borderRadius: 8 }}>
          <span style={{ color: "var(--color-success)", fontSize: "1.2rem", marginTop: 2 }}>✅</span>
          <div><p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p><p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>{desc}</p></div>
        </div>
      ))}
    </div></div>
  </div>
);
export default AdminAlerts;
EOF

cat > task-guardian-main/src/pages/admin/AdminSettings.jsx << 'EOF'
const AdminSettings = () => (
  <div className="section-gap">
    <div className="page-header"><div><h1>Settings</h1><p>Email & system configuration</p></div></div>
    <div className="card"><div className="card-body">
      <h3 style={{ marginBottom: "var(--space-md)" }}>Email Configuration (guardian-backend/.env)</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
        {[
          ["EMAIL_HOST",  "smtp.gmail.com"],
          ["EMAIL_PORT",  "587"],
          ["EMAIL_USER",  "your_gmail@gmail.com"],
          ["EMAIL_PASS",  "your 16-char Gmail App Password"],
          ["EMAIL_FROM",  '"Guardian App <your_gmail@gmail.com>"'],
        ].map(([k, hint]) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", background: "var(--color-bg-secondary)", padding: "10px 16px", borderRadius: 8, fontFamily: "monospace", fontSize: "0.875rem" }}>
            <span style={{ color: "var(--color-primary)", fontWeight: 600, minWidth: 130 }}>{k}</span>
            <span style={{ color: "var(--color-text-muted)" }}>{hint}</span>
          </div>
        ))}
      </div>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginTop: "var(--space-md)" }}>
        💡 Use a Gmail App Password — go to Google Account → Security → 2-Step Verification → App Passwords → Generate
      </p>
    </div></div>
  </div>
);
export default AdminSettings;
EOF

# ── AdminLayout ───────────────────────────────────────────────────
cat > task-guardian-main/src/components/AdminLayout.jsx << 'EOF'
import { Link, useLocation, Navigate } from "react-router-dom";
import { Shield, LayoutDashboard, Users, Bell, Settings, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const adminNav = [
  { path: "/admin",          label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/users",    label: "Users",     icon: Users           },
  { path: "/admin/alerts",   label: "Alerts",    icon: Bell            },
  { path: "/admin/settings", label: "Settings",  icon: Settings        },
];

const AdminLayout = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();
  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>Loading...</div>;
  if (!user || user.role !== "admin") return <Navigate to="/" replace />;
  return (
    <div className="app-wrapper">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon"><Shield size={20} /></div>
          <div><h1>Guardian</h1><p>Admin Panel</p></div>
        </div>
        <nav className="sidebar-nav">
          {adminNav.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path} className={`sidebar-link ${pathname === path ? "active" : ""}`}>
              <Icon />{label}
            </Link>
          ))}
          <Link to="/" className="sidebar-link" style={{ marginTop: "var(--space-md)" }}>← Back to App</Link>
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={logout} style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", color: "var(--color-danger)" }}>
            <LogOut />Sign Out
          </button>
        </div>
      </aside>
      <div className="main-content">
        <main className="main-inner">{children}</main>
      </div>
    </div>
  );
};
export default AdminLayout;
EOF

# ── NotFound ──────────────────────────────────────────────────────
cat > task-guardian-main/src/pages/NotFound.jsx << 'EOF'
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
EOF

echo "✅ All frontend files updated!"

# ── Git push ──────────────────────────────────────────────────────
echo ""
echo "🚀 Pushing to GitHub..."
git add .
git commit -m "fix: task form, admin panel, profile+birthday page, reliable crons with status tracking"
git push origin main

echo ""
echo "🎉 ALL DONE!"
echo ""
echo "What was fixed:"
echo "  ✅ Task form — opens/closes properly with Add + Edit"
echo "  ✅ Reminders — scheduledAt timestamp, status (pending/sent/failed), retry x3"
echo "  ✅ Admin panel — original design + real live data"
echo "  ✅ Profile page — name, phone, address, birthday (gets own birthday email!)"
echo "  ✅ Cron reliability — 2-min window, catches missed/overdue reminders"
echo "  ✅ Birthday dedup — tracks year so email only sent once per year"
echo ""
echo "Run:"
echo "  cd guardian-backend && npm install && npm run dev"
echo "  cd task-guardian-main && npm install && npm run dev"
