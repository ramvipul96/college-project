const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  dateTime:    { type: Date, required: true },
  isActive:    { type: Boolean, default: true },
  emailSent:   { type: Boolean, default: false },
  repeat:      { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);
