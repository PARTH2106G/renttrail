const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema(
  {
    agreementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agreement', required: true },
    type: {
      type: String,
      enum: ['repair_request', 'notice', 'inspection', 'rent_receipt', 'other'],
      required: true,
    },
    description: { type: String, required: true },
    photoUrls: [String],
    timestamp: { type: Date, default: Date.now, immutable: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EventLog', eventLogSchema);
