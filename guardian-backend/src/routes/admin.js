const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const Alert = require('../models/Alert');
const SystemSettings = require('../models/SystemSettings');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// ─── ADMIN DASHBOARD ───────────────────────────────────────────────────────────

// @route   GET /api/admin/dashboard
// @desc    Get system-wide stats for admin dashboard
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, activeToday, alertsTriggered, missedCheckins, recentAlerts] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastLogin: { $gte: today } }),
      Alert.countDocuments(),
      Alert.countDocuments({ type: 'Missed check-in', status: { $ne: 'Resolved' } }),
      Alert.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: { totalUsers, activeToday, alertsTriggered, missedCheckins },
        recentAlerts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── USERS ─────────────────────────────────────────────────────────────────────

// @route   GET /api/admin/users
// @desc    Get all users with their task + alert counts
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const { search, status } = req.query;

    const filter = {};
    if (status && status !== 'All') filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    // Enrich each user with task + alert counts
    const enriched = await Promise.all(
      users.map(async (u) => {
        const [taskCount, alertCount] = await Promise.all([
          Task.countDocuments({ user: u._id }),
          Alert.countDocuments({ user: u._id }),
        ]);
        return {
          _id: u._id,
          name: u.name,
          email: u.email,
          status: u.status,
          role: u.role,
          lastLogin: u.lastLogin,
          tasks: taskCount,
          alerts: alertCount,
          createdAt: u.createdAt,
        };
      })
    );

    res.status(200).json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get a single user's full profile
// @access  Admin
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/admin/users/:id
// @desc    Update a user's status or role
// @access  Admin
router.patch('/users/:id', async (req, res) => {
  try {
    const allowed = ['status', 'role'];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, message: 'User deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── ALERTS ────────────────────────────────────────────────────────────────────

// @route   GET /api/admin/alerts
// @desc    Get all alerts with user info
// @access  Admin
router.get('/alerts', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'All') filter.status = status;

    const alerts = await Alert.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/admin/alerts/:id
// @desc    Update alert status (e.g., resolve it)
// @access  Admin
router.patch('/alerts/:id', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        ...(req.body.status === 'Resolved' ? { resolvedAt: new Date() } : {}),
      },
      { new: true, runValidators: true }
    ).populate('user', 'name email');

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    res.status(200).json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── SYSTEM SETTINGS ───────────────────────────────────────────────────────────

// @route   GET /api/admin/settings
// @desc    Get system settings (creates defaults if none exist)
// @access  Admin
router.get('/settings', async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/admin/settings
// @desc    Update system settings
// @access  Admin
router.put('/settings', async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = await SystemSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
