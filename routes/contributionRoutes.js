const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Contribution = require("../models/contributionModel");

// POST /api/contributions
router.post("/", async (req, res) => {
  try {
    let { tenantId, memberNumber, amount, month, year } = req.body;

    if (!tenantId || !memberNumber || !amount || !month || !year) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Normalize Nano IDs
    tenantId = tenantId.trim();
    memberNumber = memberNumber.toString().trim();
    amount = parseInt(amount);
    year = parseInt(year);

    // 1️⃣ Find the member
    const user = await User.findOne({ tenantId, memberNumber });
    if (!user) return res.status(404).json({ error: "Member not found in this tenant." });

    const { firstName, lastName } = user;

    // 2️⃣ Find or create contribution document
    let contributionDoc = await Contribution.findOne({ tenantId, memberNumber });

    if (!contributionDoc) {
      // New contribution record
      contributionDoc = new Contribution({
        tenantId,
        memberNumber,
        firstName,
        lastName,
        contributions: [
          { year, monthly: { [month]: amount } }
        ]
      });
    } else {
      // Existing record: update or add year
      const yearEntry = contributionDoc.contributions.find(c => c.year === year);
      if (yearEntry) {
        yearEntry.monthly[month] = amount;
      } else {
        contributionDoc.contributions.push({ year, monthly: { [month]: amount } });
      }
    }

    await contributionDoc.save();
    res.status(201).json({ message: "Contribution saved successfully." });

  } catch (error) {
    console.error("❌ Error processing contribution:", error);
    res.status(500).json({ error: "Server error occurred." });
  }
});

// GET /api/contributions
router.get("/", async (req, res) => {
  try {
    let { tenantId, memberNumber, year, month } = req.query;

    if (!tenantId) return res.status(400).json({ error: "Tenant ID is required." });

    // Normalize Nano IDs
    tenantId = tenantId.trim();
    memberNumber = memberNumber?.toString().trim();
    const parsedYear = parseInt(year || new Date().getFullYear());

    const baseQuery = { tenantId };

    // CASE 1: Specific member + month
    if (memberNumber && month) {
      const result = await Contribution.findOne(
        { ...baseQuery, memberNumber, "contributions.year": parsedYear },
        { firstName: 1, lastName: 1, tenantId: 1, memberNumber: 1, contributions: 1 }
      );
      if (!result) return res.status(404).json({ error: "No contribution found." });

      const yearData = result.contributions.find(c => c.year === parsedYear);
      const amount = yearData?.monthly[month] || 0;
      return res.status(200).json({ data: { ...result.toObject(), amount } });
    }

    // CASE 2: All members for given year + month
    if (month && !memberNumber) {
      const results = await Contribution.find(
        { ...baseQuery, "contributions.year": parsedYear },
        { firstName: 1, lastName: 1, tenantId: 1, memberNumber: 1, contributions: 1 }
      );

      const data = results.map(doc => {
        const yearData = doc.contributions.find(c => c.year === parsedYear);
        return { ...doc.toObject(), amount: yearData?.monthly[month] || 0 };
      }).filter(d => d.amount > 0);

      return res.status(200).json({ data });
    }

    // CASE 3: All months in a year for a member
    if (memberNumber && !month) {
      const result = await Contribution.findOne(
        { ...baseQuery, memberNumber, "contributions.year": parsedYear },
        { firstName: 1, lastName: 1, tenantId: 1, memberNumber: 1, contributions: 1 }
      );
      if (!result) return res.status(404).json({ error: "No contribution found." });

      const yearData = result.contributions.find(c => c.year === parsedYear);
      return res.status(200).json({ data: { ...result.toObject(), contributions: [yearData] } });
    }

    // CASE 4: All members for given year (all months)
    const results = await Contribution.find(
      { ...baseQuery, "contributions.year": parsedYear },
      { firstName: 1, lastName: 1, tenantId: 1, memberNumber: 1, contributions: 1 }
    );

    const data = results.map(doc => {
      const yearData = doc.contributions.find(c => c.year === parsedYear);
      return { ...doc.toObject(), monthly: yearData?.monthly || {} };
    });

    return res.status(200).json({ data });

  } catch (error) {
    console.error("❌ Error fetching contributions:", error);
    res.status(500).json({ error: "Server error occurred." });
  }
});

module.exports = router;
