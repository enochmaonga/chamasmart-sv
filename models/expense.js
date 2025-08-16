// models/expense.js
const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  tenantId: String,
  description: String,
  amount: Number,
  date: Date
});

module.exports = mongoose.model("Expense", expenseSchema);
