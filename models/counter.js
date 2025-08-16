const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  value: { type: Number, default: 0 }, // start from 0
}, { timestamps: true });

counterSchema.index({ tenantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Counter', counterSchema);

