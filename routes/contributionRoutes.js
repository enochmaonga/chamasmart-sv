const express = require('express');
const { MongoClient } = require('mongodb');
const router = express.Router();
require('dotenv').config();


const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let database;

async function connectToDB() {
    if (!database) {
        if (!client.topology || !client.topology.isConnected()) {
            await client.connect();
            console.log("✅ MongoClient connected.");
        }
        database = client.db("chamaxpress");
    }
    return database;
}

// POST /api/contributions
// POST /api/contributions
router.post('/', async (req, res) => {
    try {
        const { memberNumber, amount, month, year } = req.body;
        console.log("📥 Received contribution payload:", req.body);

        if (!memberNumber || !amount || !month || !year) {
            return res.status(400).json({ error: "Member number, amount, month, and year are required." });
        }

        const db = await connectToDB();
        const memberCollection = db.collection("users");
        const contributionsCollection = db.collection("contributions");

        const user = await memberCollection.findOne({ memberNumber });
        if (!user) {
            return res.status(404).json({ error: "Member with this member number not found." });
        }

        const { firstName, lastName } = user;
        const existingContribution = await contributionsCollection.findOne({ memberNumber });

        // ... (rest of your logic remains unchanged)


        if (!existingContribution) {
            const newContribution = {
                firstName,
                lastName,
                memberNumber,
                contributions: [
                    {
                        year: parseInt(year),
                        monthly: {
                            January: 0, February: 0, March: 0, April: 0, May: 0,
                            June: 0, July: 0, August: 0, September: 0,
                            October: 0, November: 0, December: 0,
                            [month]: parseInt(amount),
                        },
                    },
                ],
            };

            await contributionsCollection.insertOne(newContribution);
            return res.status(201).json({ message: "Contribution added successfully." });
        }

        const yearIndex = existingContribution.contributions.findIndex(c => c.year === parseInt(year));

        if (yearIndex > -1) {
            await contributionsCollection.updateOne(
                {
                    memberNumber,
                    [`contributions.${yearIndex}.year`]: parseInt(year),
                },
                {
                    $set: {
                        [`contributions.${yearIndex}.monthly.${month}`]: parseInt(amount),
                    },
                }
            );
        } else {
            const newYearEntry = {
                year: parseInt(year),
                monthly: {
                    January: 0, February: 0, March: 0, April: 0, May: 0,
                    June: 0, July: 0, August: 0, September: 0,
                    October: 0, November: 0, December: 0,
                    [month]: parseInt(amount),
                },
            };
            await contributionsCollection.updateOne(
                { memberNumber },
                { $push: { contributions: newYearEntry } }
            );
        }

        res.status(201).json({ message: "Contribution updated successfully." });

    } catch (error) {
        console.error("❌ Error processing contribution:", error);
        res.status(500).json({ error: "Server error occurred." });
    }
});

// GET /api/contributions?year=2024&month=January&memberNumber=5
router.get('/', async (req, res) => {
    try {
        const db = await connectToDB();
        const contributionsCollection = db.collection("contributions");

        let { year, month, memberNumber } = req.query;

        // Use current year/month if not supplied
        const now = new Date();
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        if (!year) {
            year = now.getFullYear().toString();
        }

        const parsedYear = parseInt(year);

        // CASE 1: Specific member + month
        if (memberNumber && month) {
            const result = await contributionsCollection.aggregate([
                { $match: { memberNumber: parseInt(memberNumber) } },
                { $unwind: "$contributions" },
                { $match: { "contributions.year": parsedYear } },
                {
                    $project: {
                        firstName: 1,
                        lastName: 1,
                        memberNumber: 1,
                        amount: `$contributions.monthly.${month}`
                    }
                }
            ]).toArray();

            if (result.length === 0) return res.status(404).json({ error: "No contribution found." });

            return res.status(200).json({ data: result[0] });
        }

        // CASE 2: All members for given year + month (default path)
        if (month && !memberNumber) {
            const results = await contributionsCollection.aggregate([
                { $unwind: "$contributions" },
                { $match: { "contributions.year": parsedYear } },
                {
                    $project: {
                        firstName: 1,
                        lastName: 1,
                        memberNumber: 1,
                        amount: `$contributions.monthly.${month}`
                    }
                },
                { $match: { amount: { $gt: 0 } } }
            ]).toArray();

            return res.status(200).json({ data: results });
        }

        // CASE 3: All months in a year for a member
        if (memberNumber && !month) {
            const result = await contributionsCollection.findOne(
                {
                    memberNumber: parseInt(memberNumber),
                    "contributions.year": parsedYear
                },
                {
                    projection: {
                        firstName: 1,
                        lastName: 1,
                        memberNumber: 1,
                        contributions: {
                            $filter: {
                                input: "$contributions",
                                as: "contrib",
                                cond: { $eq: ["$$contrib.year", parsedYear] }
                            }
                        }
                    }
                }
            );

            if (!result) return res.status(404).json({ error: "No contribution found." });

            return res.status(200).json({ data: result });
        }

        // CASE 4: All members for given year (all months)
        const results = await contributionsCollection.aggregate([
            { $unwind: "$contributions" },
            { $match: { "contributions.year": parsedYear } },
            {
                $project: {
                    firstName: 1,
                    lastName: 1,
                    memberNumber: 1,
                    monthly: "$contributions.monthly"
                }
            }
        ]).toArray();

        return res.status(200).json({ data: results });

    } catch (error) {
        console.error("❌ Error fetching contributions:", error);
        res.status(500).json({ error: "Server error occurred." });
    }
});



module.exports = router;
