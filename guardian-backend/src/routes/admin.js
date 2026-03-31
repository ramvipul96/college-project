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
