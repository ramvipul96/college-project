const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
  },
  relation: {
    type: String,
    required: [true, 'Relation is required'],
    trim: true,
  },
  color: {
    type: String,
    default: '#10b981',
  },
}, { timestamps: true });

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);
