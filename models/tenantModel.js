const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, unique: true },
  theme: {
    primaryColor: { type: String, default: "#616161" },
    accentColor: { type: String, default: "#666666" },
    logo: { type: String, default: "/logos/default.png" },
  },
  currency: { type: String, default: "Kshs" },
  status: { 
    type: String, 
    enum: ["active", "inactive"], 
    default: "active" 
  },
}, { timestamps: true });

module.exports = mongoose.model("Tenant", tenantSchema);
