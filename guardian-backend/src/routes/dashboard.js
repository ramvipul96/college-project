const express = require('express');
const Task = require('../models/Task');
const Reminder = require('../models/Reminder');
const Notification = require('../models/Notification');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard
// @desc    Get dashboard stats + recent activity
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const [tasksCompleted, activeReminders, alertsSent, recentNotifs] = await Promise.all([
      Task.countDocuments({ user: userId, done: true }),
      Reminder.countDocuments({ user: userId, active: true }),
      Alert.countDocuments({ user: userId }),
      Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(10),
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          tasksCompleted,
          activeReminders,
          alertsSent,
          daysActive: req.user.daysActive,
        },
        lastCheckIn: req.user.lastCheckIn,
        recentActivity: recentNotifs,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/dashboard/checkin
// @desc    User checks in ("I'm OK")
// @access  Private
router.post('/checkin', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.lastCheckIn = new Date();
    user.status = 'Active';
    await user.save({ validateBeforeSave: false });

    // Create a notification for the check-in
    await Notification.create({
      user: user._id,
      type: 'info',
      title: 'Checked in successfully',
      desc: 'You confirmed your safety. Your emergency contacts are informed.',
    });

    res.status(200).json({
      success: true,
      message: 'Check-in recorded successfully.',
      lastCheckIn: user.lastCheckIn,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
