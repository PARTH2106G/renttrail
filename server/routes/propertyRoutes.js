const express = require('express');
const router = express.Router();
const { createProperty, getProperties, updateProperty } = require('../controllers/propertyController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { propertyCreateSchema, propertyUpdateSchema, idParamSchema } = require('../validation/schemas');

router.use(protect);
router.route('/').get(getProperties).post(validate(propertyCreateSchema), createProperty);
router.route('/:id').put(validate(idParamSchema, 'params'), validate(propertyUpdateSchema), updateProperty);

module.exports = router;
