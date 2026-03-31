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

app.use(cors({ origin: '*', credentials: true }));
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
