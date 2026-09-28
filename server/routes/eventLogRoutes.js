const express = require('express');
const router = express.Router();
const { createEvent, getEventsByAgreement } = require('../controllers/eventLogController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { eventCreateSchema, agreementIdParamSchema } = require('../validation/schemas');

router.use(protect);
router.post('/', validate(eventCreateSchema), createEvent);
router.get('/agreement/:agreementId', validate(agreementIdParamSchema, 'params'), getEventsByAgreement);

module.exports = router;
