const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  dateTime:    { type: Date, required: true },
  scheduledAt: { type: Date },           // exact ms timestamp for precision
  isActive:    { type: Boolean, default: true },
  status:      { type: String, enum: ['pending', 'sent', 'failed', 'skipped'], default: 'pending' },
  emailSent:   { type: Boolean, default: false },
  sentAt:      { type: Date },
  retryCount:  { type: Number, default: 0 },
  repeat:      { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
}, { timestamps: true });

// Auto-set scheduledAt from dateTime if not provided
reminderSchema.pre('save', function(next) {
  if (!this.scheduledAt) this.scheduledAt = this.dateTime;
  next();
});

module.exports = mongoose.model('Reminder', reminderSchema);
