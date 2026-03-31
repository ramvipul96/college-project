const express = require('express');
const Reminder = require('../models/Reminder');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reminders
// @desc    Get all reminders for logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const reminders = await Reminder.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: reminders.length, data: reminders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/reminders
// @desc    Create a new reminder
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, time, repeat } = req.body;

    if (!title || !time) {
      return res.status(400).json({ success: false, message: 'Title and time are required.' });
    }

    const reminder = await Reminder.create({
      user: req.user._id,
      title,
      time,
      repeat: repeat || 'Once',
    });

    res.status(201).json({ success: true, data: reminder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/reminders/:id
// @desc    Update a reminder (toggle active, change time, etc.)
// @access  Private
router.patch('/:id', protect, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({ _id: req.params.id, user: req.user._id });

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found.' });
    }

    Object.assign(reminder, req.body);
    await reminder.save();

    res.status(200).json({ success: true, data: reminder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/reminders/:id
// @desc    Delete a reminder
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!reminder) {
      return res.status(404).json({ success: false, message: 'Reminder not found.' });
    }

    res.status(200).json({ success: true, message: 'Reminder deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
