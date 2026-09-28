const mongoose = require('mongoose');

const agreementSchema = new mongoose.Schema(
  {
    landlordId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    rentAmount: { type: Number, required: true },
    depositAmount: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    rentDueDay: { type: Number, default: 5 }, // day of month rent is due
    agreementStatus: {
      type: String,
      enum: ['draft', 'active', 'expired', 'terminated'],
      default: 'draft',
    },
    documentUrl: { type: String }, // generated PDF stored on S3
  },
  { timestamps: true }
);

agreementSchema.index({ landlordId: 1, createdAt: -1 });
agreementSchema.index({ propertyId: 1, agreementStatus: 1 });
agreementSchema.index({ tenantId: 1, agreementStatus: 1 });

module.exports = mongoose.model('Agreement', agreementSchema);
