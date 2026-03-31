const express = require('express');
const EmergencyContact = require('../models/EmergencyContact');
const SystemSettings = require('../models/SystemSettings');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/contacts
// @desc    Get all emergency contacts for logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const contacts = await EmergencyContact.find({ user: req.user._id }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, count: contacts.length, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/contacts
// @desc    Add a new emergency contact
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, phone, email, relation, color } = req.body;

    if (!name || !phone || !email || !relation) {
      return res.status(400).json({ success: false, message: 'Name, phone, email, and relation are required.' });
    }

    // Enforce max contacts from system settings
    const settings = await SystemSettings.findOne();
    const maxContacts = settings ? settings.maxContacts : 5;
    const currentCount = await EmergencyContact.countDocuments({ user: req.user._id });

    if (currentCount >= maxContacts) {
      return res.status(400).json({
        success: false,
        message: `You can only have up to ${maxContacts} emergency contacts.`,
      });
    }

    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
    const contact = await EmergencyContact.create({
      user: req.user._id,
      name,
      phone,
      email,
      relation,
      color: color || colors[currentCount % colors.length],
    });

    // Create a notification
    await Notification.create({
      user: req.user._id,
      type: 'info',
      title: 'Emergency contact updated',
      desc: `${name} has been added to your emergency contacts.`,
    });

    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/contacts/:id
// @desc    Remove an emergency contact
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const contact = await EmergencyContact.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }

    res.status(200).json({ success: true, message: 'Contact removed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
