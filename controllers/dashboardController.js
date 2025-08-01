const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

const getDashboardStats = async (req, res) => {
  try {
    const db = await connectToDB();
    const usersCollection = db.collection("users");
    const contributionsCollection = db.collection("contributions");

    const totalUsers = await usersCollection.countDocuments();
    const totalContributions = await contributionsCollection.countDocuments();

    const amountAggregation = await contributionsCollection.aggregate([
      { $unwind: "$contributions" },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $sum: {
                $map: {
                  input: { $objectToArray: "$contributions.monthly" },
                  as: "month",
                  in: "$$month.v"
                }
              }
            }
          }
        }
      }
    ]).toArray();

    const totalAmount = amountAggregation[0]?.total || 0;

    res.json({
      totalUsers,
      totalContributions,
      totalAmount,
    });

  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};

module.exports = {
  getDashboardStats,
};
