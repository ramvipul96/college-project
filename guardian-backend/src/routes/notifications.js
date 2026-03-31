const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get all notifications for logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    const unreadCount = notifications.filter((n) => !n.read).length;

    res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.patch('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a single notification as read
// @access  Private
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a single notification
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    res.status(200).json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
