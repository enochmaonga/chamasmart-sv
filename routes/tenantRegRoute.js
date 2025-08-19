// routes/tenantRoutes.js
const express = require('express');
const router = express.Router();
const Tenant = require('../models/tenantModel');

// Register new tenant
router.post('/register-tenant', async (req, res) => {
    const { name, theme, currency } = req.body; // 👈 allow theme + currency from frontend

    if (!name) {
        return res.status(400).json({ message: 'Tenant name is required' });
    }

    try {
        const existing = await Tenant.findOne({ name });
        if (existing) {
            return res.status(409).json({ message: 'Tenant already exists' });
        }

        // Auto-generate tenantId
        const lastTenant = await Tenant.findOne({})
            .sort({ tenantId: -1 })
            .collation({ locale: "en_US", numericOrdering: true });

        let newNumber = 1;
        if (lastTenant && lastTenant.tenantId && lastTenant.tenantId.startsWith("TN")) {
            const numPart = lastTenant.tenantId.replace("TN", "");
            const parsedNum = parseInt(numPart, 10);
            if (!isNaN(parsedNum)) {
                newNumber = parsedNum + 1;
            }
        }

        const tenantId = `TN${String(newNumber).padStart(3, '0')}`;

        // Create tenant with theme + currency
        const tenant = new Tenant({
            name,
            tenantId,
            theme: {
                primaryColor: theme?.primaryColor || "#5560bfff",
                accentColor: theme?.accentColor || "#666666",
                logo: theme?.logo || "/logos/default.png",
            },
            currency: currency || "Kshs",
        });

        await tenant.save();

        res.status(201).json({
            message: 'Tenant registered successfully',
            tenant,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error registering tenant', error: err.message });
    }
});

// Get all tenants
router.get("/", async (req, res) => {
    try {
        const tenants = await Tenant.find({}).sort({ tenantId: 1 });
        res.json(tenants);
    } catch (err) {
        console.error("Error fetching tenants:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Get tenant by tenantId
router.get("/:tenantId", async (req, res) => {
    try {
        const { tenantId } = req.params;
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

module.exports = router;
