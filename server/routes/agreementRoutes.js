const express = require('express');
const router = express.Router();
const {
  createAgreement,
  getAgreements,
  getAgreementById,
  updateAgreement,
  terminateAgreement,
} = require('../controllers/agreementController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  agreementCreateSchema,
  agreementUpdateSchema,
  agreementTerminateSchema,
  idParamSchema,
} = require('../validation/schemas');

router.use(protect); // every agreement route requires a logged-in landlord/manager

router.route('/').get(getAgreements).post(validate(agreementCreateSchema), createAgreement);
router.route('/:id')
  .get(validate(idParamSchema, 'params'), getAgreementById)
  .put(validate(idParamSchema, 'params'), validate(agreementUpdateSchema), updateAgreement);
router.patch(
  '/:id/terminate',
  validate(idParamSchema, 'params'),
  validate(agreementTerminateSchema),
  terminateAgreement
);

module.exports = router;
