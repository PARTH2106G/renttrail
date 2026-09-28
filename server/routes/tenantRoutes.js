const express = require('express');
const router = express.Router();
const {
  createTenant,
  getTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
} = require('../controllers/tenantController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { tenantCreateSchema, tenantUpdateSchema, idParamSchema } = require('../validation/schemas');

router.use(protect);
router.route('/').post(validate(tenantCreateSchema), createTenant).get(getTenants);
router
  .route('/:id')
  .get(validate(idParamSchema, 'params'), getTenantById)
  .put(validate(idParamSchema, 'params'), validate(tenantUpdateSchema), updateTenant)
  .delete(validate(idParamSchema, 'params'), deleteTenant);

module.exports = router;
