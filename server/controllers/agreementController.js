const Agreement = require('../models/Agreement');
const RentPayment = require('../models/RentPayment');
const EventLog = require('../models/EventLog');

// Create a new agreement, and auto-generate the rent-payment schedule for its duration
exports.createAgreement = async (req, res, next) => {
  try {
    const agreement = await Agreement.create(req.body);

    // Auto-generate monthly RentPayment docs between startDate and endDate
    const payments = [];
    let cursor = new Date(agreement.startDate);
    const end = new Date(agreement.endDate);
    while (cursor <= end) {
      const dueDate = new Date(cursor.getFullYear(), cursor.getMonth(), agreement.rentDueDay);
      payments.push({ agreementId: agreement._id, dueDate, amount: agreement.rentAmount });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    await RentPayment.insertMany(payments);

    await EventLog.create({
      agreementId: agreement._id,
      type: 'other',
      description: 'Agreement created and rent schedule generated',
    });

    res.status(201).json(agreement);
  } catch (err) {
    next(err);
  }
};

exports.getAgreements = async (req, res, next) => {
  try {
    const agreements = await Agreement.find()
      .populate('propertyId', 'address unitNo')
      .populate('tenantId', 'name phone');
    res.json(agreements);
  } catch (err) {
    next(err);
  }
};

exports.getAgreementById = async (req, res, next) => {
  try {
    const agreement = await Agreement.findById(req.params.id)
      .populate('propertyId')
      .populate('tenantId');
    if (!agreement) return res.status(404).json({ message: 'Agreement not found' });
    res.json(agreement);
  } catch (err) {
    next(err);
  }
};

exports.updateAgreement = async (req, res, next) => {
  try {
    const agreement = await Agreement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!agreement) return res.status(404).json({ message: 'Agreement not found' });
    res.json(agreement);
  } catch (err) {
    next(err);
  }
};

exports.terminateAgreement = async (req, res, next) => {
  try {
    const agreement = await Agreement.findByIdAndUpdate(
      req.params.id,
      { agreementStatus: 'terminated' },
      { new: true }
    );
    await EventLog.create({
      agreementId: agreement._id,
      type: 'notice',
      description: req.body.reason || 'Agreement terminated',
    });
    res.json(agreement);
  } catch (err) {
    next(err);
  }
};
