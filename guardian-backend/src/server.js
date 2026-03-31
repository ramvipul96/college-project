require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('../config/db');

// Route imports
const authRoutes             = require('./routes/auth');
const dashboardRoutes        = require('./routes/dashboard');
const taskRoutes             = require('./routes/tasks');
const reminderRoutes         = require('./routes/reminders');
const emergencyContactRoutes = require('./routes/emergencyContacts');
const notificationRoutes     = require('./routes/notifications');
const adminRoutes            = require('./routes/admin');

// Connect to MongoDB
connectDB();

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', // Vite default port
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/tasks',        taskRoutes);
app.use('/api/reminders',    reminderRoutes);
app.use('/api/contacts',     emergencyContactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin',        adminRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Guardian API is running 🛡️' });
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Guardian server running on http://localhost:${PORT}`);
});
