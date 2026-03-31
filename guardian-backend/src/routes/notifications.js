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
