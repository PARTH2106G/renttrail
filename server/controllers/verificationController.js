const Verification = require('../models/Verification');
const { canAccessAgreement } = require('../utils/ownership');

const ALLOWED_TRANSITIONS = {
  submitted: ['in_review'],
  in_review: ['cleared', 'flagged'],
  cleared: [],
  flagged: ['in_review'],
};

exports.createVerification = async (req, res, next) => {
  try {
    await canAccessAgreement(req.body.agreementId, req.user.id);
    const existing = await Verification.findOne({ agreementId: req.body.agreementId });
    if (existing) {
      return res.status(409).json({ message: 'Verification already exists for this agreement' });
    }

    const verification = await Verification.create(req.body);
    res.status(201).json(verification);
  } catch (err) {
    next(err);
  }
};

exports.getVerificationByAgreement = async (req, res, next) => {
  try {
    await canAccessAgreement(req.params.agreementId, req.user.id);
    const verification = await Verification.findOne({ agreementId: req.params.agreementId });
    if (!verification) return res.status(404).json({ message: 'Verification not found' });
    res.json(verification);
  } catch (err) {
    next(err);
  }
};

// Enforces the state machine: submitted -> in_review -> cleared/flagged -> (flagged can retry) in_review
exports.updateStage = async (req, res, next) => {
  try {
    const { nextStage } = req.body;
    const verification = await Verification.findById(req.params.id);
    if (!verification) return res.status(404).json({ message: 'Verification not found' });
    await canAccessAgreement(verification.agreementId, req.user.id);

    if (!ALLOWED_TRANSITIONS[verification.stage].includes(nextStage)) {
      return res.status(400).json({
        message: `Cannot move from '${verification.stage}' to '${nextStage}'`,
      });
    }

    verification.stage = nextStage;
    if (nextStage === 'cleared') verification.clearedDate = new Date();
    await verification.save();
    res.json(verification);
  } catch (err) {
    next(err);
  }
};
