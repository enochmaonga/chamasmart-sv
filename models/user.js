const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  tenantId: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: String,
  password: String,
  memberNumber: { type: String, required: true },
  userType: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  createdAt: { type: Date, default: Date.now },
});

// Make memberNumber unique per tenant
userSchema.index({ tenantId: 1, memberNumber: 1 }, { unique: true });

// Also make email unique per tenant (optional)
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
