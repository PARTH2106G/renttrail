const express = require('express');
const router = express.Router();
const { createProperty, getProperties, updateProperty } = require('../controllers/propertyController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(getProperties).post(createProperty);
router.route('/:id').put(updateProperty);

module.exports = router;
