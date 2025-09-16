// routes/superUserDashboard.js
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Tenant = require("../models/tenantModel");
const { verifyToken, requireSuperUser } = require("../middleware/authMiddleware");

// Super user dashboard stats
router.get("/super-stats", verifyToken, requireSuperUser, async (req, res) => {
  try {
    // 1️⃣ Total tenants
    const totalTenants = await Tenant.countDocuments();

    // 2️⃣ Total users across all tenants
    const totalUsers = await User.countDocuments();

    // 3️⃣ Breakdown per tenant with status
    const tenantsWithCounts = await Tenant.aggregate([
      {
        $lookup: {
          from: "users", // collection name in MongoDB
          localField: "tenantId",
          foreignField: "tenantId",
          as: "users",
        },
      },
      {
        $project: {
          name: 1,
          tenantId: 1,
          status: { $ifNull: ["$status", "active"] },
          totalUsers: { $size: "$users" },
        },
      },
    ]);

    res.json({
      totalTenants,
      totalUsers,
      tenants: tenantsWithCounts, // detailed breakdown
    });
  } catch (err) {
    console.error("Error fetching super user stats:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Toggle tenant status (superuser)
router.put("/tenants/:tenantId/toggle-status", verifyToken, requireSuperUser, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });

    tenant.status = tenant.status === "active" ? "inactive" : "active";
    await tenant.save();

    res.json({ message: `Tenant is now ${tenant.status}`, tenant });
  } catch (err) {
    console.error("Error toggling tenant status:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
