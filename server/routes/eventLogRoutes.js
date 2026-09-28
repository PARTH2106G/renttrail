const express = require('express');
const router = express.Router();
const { createEvent, getEventsByAgreement } = require('../controllers/eventLogController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/', createEvent);
router.get('/agreement/:agreementId', getEventsByAgreement);

module.exports = router;
