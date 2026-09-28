const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    aadhaarRef: { type: String }, // store only a masked reference, never full number
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tenant', tenantSchema);
