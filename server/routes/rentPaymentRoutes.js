const express = require('express');
const router = express.Router();
const { getPaymentsByAgreement, markPaid } = require('../controllers/rentPaymentController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { agreementIdParamSchema, idParamSchema, rentPaymentMarkPaidSchema } = require('../validation/schemas');

router.use(protect);
router.get('/agreement/:agreementId', validate(agreementIdParamSchema, 'params'), getPaymentsByAgreement);
router.patch('/:id/mark-paid', validate(idParamSchema, 'params'), validate(rentPaymentMarkPaidSchema), markPaid);

module.exports = router;
