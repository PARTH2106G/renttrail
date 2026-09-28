const mongoose = require('mongoose');

const rentPaymentSchema = new mongoose.Schema(
  {
    agreementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agreement', required: true },
    dueDate: { type: Date, required: true },
    paidDate: { type: Date },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
    receiptUrl: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RentPayment', rentPaymentSchema);
