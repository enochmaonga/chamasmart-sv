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

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
    try {
        const db = await connectToDB();
        const userCollection = db.collection("users");
        const contributionCollection = db.collection("contributions");
        const expensesCollection = db.collection("expenses");

        // 1. Active Members count
        const totalMembersCount = await userCollection.countDocuments({});


        // 2. Total Contributions
        const allContributions = await contributionCollection.find({}).toArray();
        let totalContributions = 0;

        allContributions.forEach(member => {
            member.contributions.forEach(year => {
                for (const month in year.monthly) {
                    totalContributions += year.monthly[month];
                }
            });
        });

        // 3. Total Expenses
        const expenses = await expensesCollection.find({}).toArray();
        const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

        // 4. Balance
        const balance = totalContributions - totalExpenses;

        return res.status(200).json({
            totalMembers: totalMembersCount,
            totalContributions,
            totalExpenses,
            balance
        });

    } catch (error) {
        console.error("❌ Error fetching dashboard stats:", error);
        return res.status(500).json({ error: "Failed to fetch dashboard stats." });
    }
});

module.exports = router;
