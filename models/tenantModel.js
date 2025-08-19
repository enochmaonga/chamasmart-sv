// models/tenant.js
const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tenantId: { type: String, required: true, unique: true },
  
  theme: {
    primaryColor: { type: String, default: "#5560bfff" },   // blue fallback
    accentColor: { type: String, default: "#666666" },      // gray fallback
    logo: { type: String, default: "/logos/default.png" },  // path to logo
  },

  currency: { type: String, default: "Kshs" },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Tenant', tenantSchema);
