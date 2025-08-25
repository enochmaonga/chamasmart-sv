const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  expenseType: { type: String, required: true },   
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  beneficiary: { type: String, required: true },   
  description: { type: String }                   
}, { timestamps: true });

module.exports = mongoose.model("Expense", expenseSchema);

