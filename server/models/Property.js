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

propertySchema.index({ landlordId: 1, createdAt: -1 });
propertySchema.index({ landlordId: 1, status: 1 });

module.exports = mongoose.model('Property', propertySchema);
