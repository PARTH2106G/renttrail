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

router.use(protect); // every agreement route requires a logged-in landlord/manager

router.route('/').get(getAgreements).post(createAgreement);
router.route('/:id').get(getAgreementById).put(updateAgreement);
router.patch('/:id/terminate', terminateAgreement);

module.exports = router;
