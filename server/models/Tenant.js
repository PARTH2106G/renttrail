const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    landlordId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true },
    phone: { type: String }, // backward compatibility
    mobile: { type: String, required: true },
    email: { type: String, trim: true, lowercase: true },
    occupation: { type: String },
    emergencyContact: { type: String },
    address: { type: String },
    aadhaarRef: { type: String }, // backward compatibility
    maskedAadhaar: { type: String }, // store only a masked reference, never full number
    aadhaarVerificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
  },
  { timestamps: true }
);

tenantSchema.pre('save', function (next) {
  if (this.mobile && !this.phone) {
    this.phone = this.mobile;
  }
  if (this.maskedAadhaar && !this.aadhaarRef) {
    this.aadhaarRef = this.maskedAadhaar;
  }
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

tenantSchema.index({ landlordId: 1, createdAt: -1 });
tenantSchema.index({ landlordId: 1, mobile: 1 });

module.exports = mongoose.model('Tenant', tenantSchema);
