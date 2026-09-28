const express = require('express');
const router = express.Router();
const {
  createVerification,
  getVerificationByAgreement,
  updateStage,
} = require('../controllers/verificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/', createVerification);
router.get('/agreement/:agreementId', getVerificationByAgreement);
router.patch('/:id/stage', updateStage);

module.exports = router;
