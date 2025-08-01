const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  phoneNumber: String,
  password: String,
  memberNumber: { type: Number, unique: true },
  userType: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user', // Default to 'user' unless specified otherwise
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
