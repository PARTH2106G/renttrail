const RentPayment = require('../models/RentPayment');
const { canAccessAgreement } = require('../utils/ownership');

exports.getPaymentsByAgreement = async (req, res, next) => {
  try {
    await canAccessAgreement(req.params.agreementId, req.user.id);
    const payments = await RentPayment.find({ agreementId: req.params.agreementId }).sort('dueDate');
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

exports.markPaid = async (req, res, next) => {
  try {
    const payment = await RentPayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    await canAccessAgreement(payment.agreementId, req.user.id);
    if (payment.status === 'paid') {
      return res.status(409).json({ message: 'Payment is already marked as paid' });
    }
    if (!['pending', 'overdue'].includes(payment.status)) {
      return res.status(400).json({ message: 'Invalid payment state transition' });
    }

    payment.status = 'paid';
    payment.paidDate = new Date();
    if (req.body.receiptUrl) {
      payment.receiptUrl = req.body.receiptUrl;
    }
    await payment.save();
    res.json(payment);
  } catch (err) {
    next(err);
  }
};
