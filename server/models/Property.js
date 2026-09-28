const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    landlordId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    address: { type: String, required: true },
    unitNo: { type: String },
    status: { type: String, enum: ['vacant', 'occupied', 'under_notice'], default: 'vacant' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Property', propertySchema);
