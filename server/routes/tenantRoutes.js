const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { createTenant, getTenants, getTenant, updateTenant } = require('../controllers/tenantController');

router.use(protect);
router.route('/').get(getTenants).post(createTenant);
router.route('/:id').get(getTenant).put(updateTenant);

module.exports = router;
