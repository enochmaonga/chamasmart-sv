const express = require("express");
const router = express.Router();
const Expense = require("../models/expense");


// POST /api/expenses
router.post("/", async (req, res) => {
  try {
    let { tenantId, expenseType, amount, date, beneficiary, description } = req.body;

    if (!tenantId || !expenseType || !amount || !date || !beneficiary) {
      return res.status(400).json({ error: "tenantId, expenseType, amount, date, beneficiary are required." });
    }

    const expense = new Expense({
      tenantId: tenantId.trim(),
      expenseType,
      amount: parseFloat(amount),
      date: new Date(date),
      beneficiary,
      description
    });

    await expense.save();
    res.status(201).json({ message: "Expense saved successfully.", data: expense });

  } catch (error) {
    console.error("❌ Error saving expense:", error);
    res.status(500).json({ error: "Server error occurred." });
  }
});

// GET /api/expenses
router.get("/", async (req, res) => {
  try {
    let { tenantId, year, month } = req.query;

    if (!tenantId) return res.status(400).json({ error: "Tenant ID is required." });

    const query = { tenantId: tenantId.trim() };

    // Filter by year/month if provided
    if (year || month) {
      query.date = {};
      if (year) {
        const start = new Date(`${year}-01-01`);
        const end = new Date(`${parseInt(year) + 1}-01-01`);
        query.date.$gte = start;
        query.date.$lt = end;
      }
      if (month) {
        const start = new Date(`${year || new Date().getFullYear()}-${month}-01`);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        query.date = { $gte: start, $lt: end };
      }
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.status(200).json({ data: expenses });

  } catch (error) {
    console.error("❌ Error fetching expenses:", error);
    res.status(500).json({ error: "Server error occurred." });
  }
});


// PUT /api/expenses/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let { tenantId, expenseType, amount, date, beneficiary, description } = req.body;

    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required." });
    }

    const expense = await Expense.findOne({ _id: id, tenantId: tenantId.trim() });
    if (!expense) {
      return res.status(404).json({ error: "Expense not found for this tenant." });
    }

    // Update fields
    if (expenseType) expense.expenseType = expenseType;
    if (amount) expense.amount = parseFloat(amount);
    if (date) expense.date = new Date(date);
    if (beneficiary) expense.beneficiary = beneficiary;
    if (description) expense.description = description;

    await expense.save();
    res.status(200).json({ message: "Expense updated successfully.", data: expense });

  } catch (error) {
    console.error("❌ Error updating expense:", error);
    res.status(500).json({ error: "Server error occurred." });
  }
});

module.exports = router;
