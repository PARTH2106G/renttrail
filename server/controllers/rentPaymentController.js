const RentPayment = require('../models/RentPayment');

exports.getPaymentsByAgreement = async (req, res, next) => {
  try {
    const payments = await RentPayment.find({ agreementId: req.params.agreementId }).sort('dueDate');
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

exports.markPaid = async (req, res, next) => {
  try {
    const payment = await RentPayment.findByIdAndUpdate(
      req.params.id,
      { status: 'paid', paidDate: new Date(), receiptUrl: req.body.receiptUrl },
      { new: true }
    );
    res.json(payment);
  } catch (err) {
    next(err);
  }
};
