const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema(
  {
    agreementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agreement', required: true },
    stage: {
      type: String,
      enum: ['submitted', 'in_review', 'cleared', 'flagged'],
      default: 'submitted',
    },
    documentsChecklist: [
      {
        name: String, // e.g. "Aadhaar copy", "Previous landlord reference"
        received: { type: Boolean, default: false },
      },
    ],
    submittedDate: { type: Date, default: Date.now },
    clearedDate: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

verificationSchema.index({ agreementId: 1 });
verificationSchema.index({ stage: 1, updatedAt: -1 });

module.exports = mongoose.model('Verification', verificationSchema);
