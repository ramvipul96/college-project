const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  inactivityThreshold: { type: Number, default: 6 },    // hours
  escalationDelay:     { type: Number, default: 2 },    // hours
  checkInTime:         { type: String, default: '09:00' },
  maxContacts:         { type: Number, default: 5 },
  emailNotifs:         { type: Boolean, default: true },
  smsNotifs:           { type: Boolean, default: true },
  autoEscalate:        { type: Boolean, default: true },
  dailyReports:        { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
