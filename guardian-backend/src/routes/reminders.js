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
