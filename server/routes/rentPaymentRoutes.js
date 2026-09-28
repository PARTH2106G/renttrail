const express = require('express');
const router = express.Router();
const { getPaymentsByAgreement, markPaid } = require('../controllers/rentPaymentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/agreement/:agreementId', getPaymentsByAgreement);
router.patch('/:id/mark-paid', markPaid);

module.exports = router;
