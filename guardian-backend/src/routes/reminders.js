const express = require('express');
const Reminder = require('../models/Reminder');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  const reminders = await Reminder.find({ user: req.user._id }).sort({ dateTime: 1 });
  res.json({ success: true, data: reminders });
});
router.post('/', protect, async (req, res) => {
  try {
    const reminder = await Reminder.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: reminder });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
router.put('/:id', protect, async (req, res) => {
  const reminder = await Reminder.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { ...req.body, emailSent: false },
    { new: true }
  );
  if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
  res.json({ success: true, data: reminder });
});
router.delete('/:id', protect, async (req, res) => {
  await Reminder.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true, message: 'Reminder deleted' });
});

module.exports = router;
