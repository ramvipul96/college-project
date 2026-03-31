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
