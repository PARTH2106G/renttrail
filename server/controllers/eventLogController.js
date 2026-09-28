const EventLog = require('../models/EventLog');

exports.createEvent = async (req, res, next) => {
  try {
    const event = await EventLog.create(req.body); // timestamp is server-set and immutable
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
};

exports.getEventsByAgreement = async (req, res, next) => {
  try {
    const events = await EventLog.find({ agreementId: req.params.agreementId }).sort('-timestamp');
    res.json(events);
  } catch (err) {
    next(err);
  }
};
