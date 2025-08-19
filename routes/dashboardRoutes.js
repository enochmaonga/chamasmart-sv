const express = require("express");
const router = express.Router();

const Tenant = require("../models/tenantModel");
const User = require("../models/user");
const Contribution = require("../models/contributionModel");
const Expense = require("../models/expense");

// GET /api/dashboard/stats?tenantId=<Nano ID>
router.get("/stats", async (req, res) => {
    try {
        let { tenantId } = req.query;
        if (!tenantId) return res.status(400).json({ error: "tenantId is required" });

        tenantId = tenantId.trim(); // normalize Nano ID
        console.log("DEBUG: Request tenantId:", tenantId);

        // Confirm tenant exists
        const tenant = await Tenant.findOne({ $or: [{ name: tenantId }, { tenantId }] });
        if (!tenant) return res.status(404).json({ error: "" });

        const queryTenantId = tenant.tenantId; // Nano ID stored in DB
        console.log("DEBUG: Querying collections with tenantId:", queryTenantId);

        // 1️⃣ Members
        const totalMembersCount = await User.countDocuments({ tenantId: queryTenantId });

        // 2️⃣ Contributions
        const allContributions = await Contribution.find({ tenantId: queryTenantId });
        let totalContributions = 0;
        const validMonths = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        allContributions.forEach(member => {
            member.contributions?.forEach(year => {
                validMonths.forEach(month => {
                    totalContributions += Number(year.monthly?.[month]) || 0;
                });
            });
        });


        // 3️⃣ Expenses
        const expenses = await Expense.find({ tenantId: queryTenantId });
        const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        // 4️⃣ Send response
        res.json({
            totalMembers: totalMembersCount,
            totalContributions,
            totalExpenses,
            balance: totalContributions - totalExpenses
        });

    } catch (err) {
        console.error("❌ Error:", err);
        res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
});

module.exports = router;
