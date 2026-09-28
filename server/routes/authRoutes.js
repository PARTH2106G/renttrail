const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimitMiddleware');
const { registerSchema, loginSchema } = require('../validation/schemas');

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);

module.exports = router;
