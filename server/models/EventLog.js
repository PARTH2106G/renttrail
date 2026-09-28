const mongoose = require('mongoose');

const eventLogSchema = new mongoose.Schema(
  {
    agreementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agreement', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
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

eventLogSchema.index({ agreementId: 1, timestamp: -1 });
eventLogSchema.index({ ownerId: 1, timestamp: -1 });

module.exports = mongoose.model('EventLog', eventLogSchema);
