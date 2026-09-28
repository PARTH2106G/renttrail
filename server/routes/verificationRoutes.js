const express = require('express');
const router = express.Router();
const {
  createVerification,
  getVerificationByAgreement,
  updateStage,
} = require('../controllers/verificationController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  verificationCreateSchema,
  verificationUpdateStageSchema,
  idParamSchema,
  agreementIdParamSchema,
} = require('../validation/schemas');

router.use(protect);
router.post('/', validate(verificationCreateSchema), createVerification);
router.get('/agreement/:agreementId', validate(agreementIdParamSchema, 'params'), getVerificationByAgreement);
router.patch('/:id/stage', validate(idParamSchema, 'params'), validate(verificationUpdateStageSchema), updateStage);

module.exports = router;
