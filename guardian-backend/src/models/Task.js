const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium',
  },
  due: {
    type: String, // Flexible string like "Today", "Tomorrow", or a date string
    default: 'Today',
  },
  done: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
}, { timestamps: true });

// Auto-set completedAt when task is marked done
taskSchema.pre('save', function (next) {
  if (this.isModified('done') && this.done && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
