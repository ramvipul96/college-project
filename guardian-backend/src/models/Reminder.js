const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Reminder title is required'],
    trim: true,
  },
  time: {
    type: String,
    required: [true, 'Time is required'],
  },
  repeat: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Yearly', 'Once'],
    default: 'Once',
  },
  active: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);
