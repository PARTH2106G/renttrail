const mongoose = require('mongoose');

const agreementSchema = new mongoose.Schema(
  {
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

module.exports = mongoose.model('Agreement', agreementSchema);
