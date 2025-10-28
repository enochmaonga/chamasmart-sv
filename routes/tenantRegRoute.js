const express = require("express");
const router = express.Router();
const Tenant = require("../models/tenantModel");
const { requireSuperUser, verifyToken } = require("../middleware/authMiddleware");

// ✅ Create tenant
router.post("/register-tenant", verifyToken, requireSuperUser, async (req, res) => {
  const { name, theme, currency } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Tenant name is required" });
  }

  try {
    const existing = await Tenant.findOne({ name });
    if (existing) {
      return res.status(409).json({ message: "Tenant already exists" });
    }

    // Auto-generate tenantId
    const lastTenant = await Tenant.findOne({})
      .sort({ tenantId: -1 })
      .collation({ locale: "en_US", numericOrdering: true });

    let newNumber = 1;
    if (lastTenant && lastTenant.tenantId?.startsWith("TN")) {
      const parsedNum = parseInt(lastTenant.tenantId.replace("TN", ""), 10);
      if (!isNaN(parsedNum)) newNumber = parsedNum + 1;
    }

    const tenantId = `TN${String(newNumber).padStart(3, "0")}`;

    const tenant = new Tenant({
      name,
      tenantId,
      theme: {
        primaryColor: theme?.primaryColor || "#616161",
        accentColor: theme?.accentColor || "#666666",
        logo: theme?.logo || "/logos/default.png",
      },
      currency: currency || "Kshs",
      status: "active",
    });

    await tenant.save();

    res.status(201).json({ message: "Tenant registered successfully", tenant });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error registering tenant", error: err.message });
  }
});

// ✅ List tenants
router.get("/", verifyToken, requireSuperUser, async (req, res) => {
  try {
    const tenants = await Tenant.find({}).sort({ tenantId: 1 });
    res.json(tenants);
  } catch (err) {
    console.error("Error fetching tenants:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get a single tenant
router.get("/:tenantId", verifyToken, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const user = req.user; // verifyToken attaches user object with roles/tenantId

    // 1️⃣ If the user is a super user, allow any tenantId
    // 2️⃣ If not a super user, only allow their own tenantId
    if (!user.isSuperUser && user.tenantId !== tenantId) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this tenant" });
    }

    const tenant = await Tenant.findOne({ tenantId });
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    res.json(tenant);
  } catch (err) {
    console.error("Error fetching tenant:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Update tenant
router.put("/:tenantId", verifyToken, requireSuperUser, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { name, theme, currency, status } = req.body;

    const tenant = await Tenant.findOneAndUpdate(
      { tenantId },
      {
        $set: {
          ...(name && { name }),
          ...(theme && { theme }),
          ...(currency && { currency }),
          ...(status && {status}),
        },
      },
      { new: true }
    );

    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    res.json({ message: "Tenant updated successfully", tenant });
  } catch (err) {
    console.error("Error updating tenant:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete tenant
router.delete("/:tenantId", verifyToken, requireSuperUser, async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await Tenant.findOneAndDelete({ tenantId });

    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    res.json({ message: "Tenant deleted successfully" });
  } catch (err) {
    console.error("Error deleting tenant:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get tenant info for the logged-in user
router.get("/my-tenant", verifyToken, async (req, res) => {
  try {
    const user = req.user; // assume verifyToken attaches user info
    if (!user.tenantId) return res.status(400).json({ message: "User has no tenant assigned" });

    const tenant = await Tenant.findOne({ tenantId: user.tenantId });
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    res.json({
      id: tenant.tenantId,
      name: tenant.name,
      theme: tenant.theme,
      currency: tenant.currency,
    });
  } catch (err) {
    console.error("Error fetching user tenant:", err);
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = router;
