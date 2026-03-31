const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:          { type: String, required: true, trim: true },
  phone:         { type: String, default: '' },
  email:         { type: String, default: '' },
  relationship:  { type: String, default: '' },
  birthdayMonth: { type: Number, min: 1, max: 12 },
  birthdayDay:   { type: Number, min: 1, max: 31 },
}, { timestamps: true });

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);
