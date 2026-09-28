const mongoose = require('mongoose');
const Agreement = require('../models/Agreement');
const RentPayment = require('../models/RentPayment');
const EventLog = require('../models/EventLog');
const { ensurePropertyOwnership, ensureTenantOwnership, canAccessAgreement } = require('../utils/ownership');
const { generateMonthlySchedule } = require('../utils/schedule');

const transactionNotSupported = (error) =>
  /Transaction numbers are only allowed on a replica set member or mongos/i.test(error.message || '');

const createAgreementNoTransaction = async ({ payload, userId, propertyId, tenantId }) => {
  const agreement = await Agreement.create({
    ...payload,
    propertyId,
    tenantId,
    landlordId: userId,
  });
  const payments = generateMonthlySchedule({
    startDate: agreement.startDate,
    endDate: agreement.endDate,
    rentDueDay: agreement.rentDueDay,
    agreementId: agreement._id,
    amount: agreement.rentAmount,
  });
  if (payments.length) {
    await RentPayment.insertMany(payments);
  }
  await EventLog.create({
    agreementId: agreement._id,
    userId,
    ownerId: userId,
    action: 'agreement_created',
    entityType: 'agreement',
    entityId: agreement._id,
    metadata: { scheduleCount: payments.length },
    type: 'other',
    description: 'Agreement created and rent schedule generated',
  });
  return agreement;
};

exports.createAgreement = async (req, res, next) => {
  try {
    const { propertyId, tenantId, ...payload } = req.body;
    await ensurePropertyOwnership(propertyId, req.user.id);
    await ensureTenantOwnership(tenantId, req.user.id);

    let agreement;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const [created] = await Agreement.create(
          [
            {
              ...payload,
              propertyId,
              tenantId,
              landlordId: req.user.id,
            },
          ],
          { session }
        );

        const payments = generateMonthlySchedule({
          startDate: created.startDate,
          endDate: created.endDate,
          rentDueDay: created.rentDueDay,
          agreementId: created._id,
          amount: created.rentAmount,
        });

        if (payments.length) {
          await RentPayment.insertMany(payments, { session });
        }

        await EventLog.create(
          [
            {
              agreementId: created._id,
              userId: req.user.id,
              ownerId: req.user.id,
              action: 'agreement_created',
              entityType: 'agreement',
              entityId: created._id,
              metadata: { scheduleCount: payments.length },
              type: 'other',
              description: 'Agreement created and rent schedule generated',
            },
          ],
          { session }
        );
        agreement = created;
      });
    } catch (err) {
      if (transactionNotSupported(err)) {
        agreement = await createAgreementNoTransaction({ payload, userId: req.user.id, propertyId, tenantId });
      } else {
        throw err;
      }
    } finally {
      await session.endSession();
    }

    res.status(201).json(agreement);
  } catch (err) {
    next(err);
  }
};

exports.getAgreements = async (req, res, next) => {
  try {
    const agreements = await Agreement.find({
      $or: [{ landlordId: req.user.id }, { landlordId: { $exists: false } }],
    })
      .populate('propertyId', 'address unitNo status landlordId')
      .populate('tenantId', 'name mobile phone');
    const scoped = agreements.filter(
      (agreement) =>
        agreement.landlordId?.toString() === req.user.id ||
        agreement.propertyId?.landlordId?.toString() === req.user.id
    );
    res.json(scoped);
  } catch (err) {
    next(err);
  }
};

exports.getAgreementById = async (req, res, next) => {
  try {
    const agreement = await canAccessAgreement(req.params.id, req.user.id);
    await agreement.populate('propertyId');
    await agreement.populate('tenantId');
    res.json(agreement);
  } catch (err) {
    next(err);
  }
};

exports.updateAgreement = async (req, res, next) => {
  try {
    const agreement = await canAccessAgreement(req.params.id, req.user.id);
    Object.assign(agreement, req.body);
    if (agreement.endDate <= agreement.startDate) {
      return res.status(400).json({ message: 'endDate must be after startDate' });
    }
    await agreement.save();
    res.json(agreement);
  } catch (err) {
    next(err);
  }
};

exports.terminateAgreement = async (req, res, next) => {
  try {
    const agreement = await canAccessAgreement(req.params.id, req.user.id);
    agreement.agreementStatus = 'terminated';
    await agreement.save();
    await EventLog.create({
      agreementId: agreement._id,
      userId: req.user.id,
      ownerId: req.user.id,
      action: 'agreement_terminated',
      entityType: 'agreement',
      entityId: agreement._id,
      metadata: { reason: req.body.reason || null },
      type: 'notice',
      description: req.body.reason || 'Agreement terminated',
    });
    res.json(agreement);
  } catch (err) {
    next(err);
  }
};
