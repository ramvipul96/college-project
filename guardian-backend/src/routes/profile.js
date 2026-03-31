const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const router = express.Router();

// GET /api/profile
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/profile
router.put('/', protect, async (req, res) => {
  try {
    const { name, phone, address, birthdayMonth, birthdayDay, birthdayYear } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address, birthdayMonth, birthdayDay, birthdayYear },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, data: user });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// PUT /api/profile/password
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

module.exports = router;
