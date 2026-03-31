const express = require('express');
const EmergencyContact = require('../models/EmergencyContact');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  const contacts = await EmergencyContact.find({ user: req.user._id }).sort({ name: 1 });
  res.json({ success: true, data: contacts });
});
router.post('/', protect, async (req, res) => {
  try {
    const contact = await EmergencyContact.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: contact });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
router.put('/:id', protect, async (req, res) => {
  const contact = await EmergencyContact.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id }, req.body, { new: true }
  );
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
  res.json({ success: true, data: contact });
});
router.delete('/:id', protect, async (req, res) => {
  await EmergencyContact.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true, message: 'Contact deleted' });
});

module.exports = router;
