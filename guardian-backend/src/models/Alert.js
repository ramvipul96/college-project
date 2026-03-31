const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['Inactivity', 'Missed check-in', 'Emergency trigger'],
    required: true,
  },
  status: {
    type: String,
    enum: ['Escalated', 'Pending', 'Resolved'],
    default: 'Pending',
  },
  contactNotified: {
    type: String,
    default: '-',
  },
  method: {
    type: String,
    enum: ['SMS', 'Email', 'SMS + Email', 'SMS + Call', '-'],
    default: '-',
  },
  resolvedAt: {
    type: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
