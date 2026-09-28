const EventLog = require('../models/EventLog');
const { canAccessAgreement } = require('../utils/ownership');

exports.createEvent = async (req, res, next) => {
  try {
    const agreement = await canAccessAgreement(req.body.agreementId, req.user.id);
    const event = await EventLog.create({
      agreementId: req.body.agreementId,
      userId: req.user.id,
      ownerId: agreement.landlordId || agreement.propertyId.landlordId,
      action: req.body.action || 'event_created',
      entityType: req.body.entityType || 'agreement_event',
      entityId: req.body.entityId || req.body.agreementId,
      metadata: req.body.metadata || {},
      type: req.body.type,
      description: req.body.description,
      photoUrls: req.body.photoUrls || [],
    });
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
};

exports.getEventsByAgreement = async (req, res, next) => {
  try {
    await canAccessAgreement(req.params.agreementId, req.user.id);
    const events = await EventLog.find({ agreementId: req.params.agreementId }).sort('-timestamp');
    res.json(events);
  } catch (err) {
    next(err);
  }
};
