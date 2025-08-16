const mongoose = require("mongoose");

const monthlySchema = new mongoose.Schema({
  January: { type: Number, default: 0 },
  February: { type: Number, default: 0 },
  March: { type: Number, default: 0 },
  April: { type: Number, default: 0 },
  May: { type: Number, default: 0 },
  June: { type: Number, default: 0 },
  July: { type: Number, default: 0 },
  August: { type: Number, default: 0 },
  September: { type: Number, default: 0 },
  October: { type: Number, default: 0 },
  November: { type: Number, default: 0 },
  December: { type: Number, default: 0 },
}, { _id: false });

const contributionYearSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  monthly: { type: monthlySchema, default: () => ({}) }
}, { _id: false });

const contributionSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  tenantName: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  memberNumber: { type: String, required: true },
  contributions: [contributionYearSchema]
});

module.exports = mongoose.model("Contribution", contributionSchema);
