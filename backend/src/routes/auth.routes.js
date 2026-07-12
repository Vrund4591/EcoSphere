const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const validators = require('../validators/auth.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');

// Public
router.post('/signup', validators.signup, validate, controller.signup);
router.post('/login', validators.login, validate, controller.login);

// Protected
router.get('/me', authenticate, controller.getMe);
router.put('/profile', authenticate, controller.updateProfile);
router.put('/change-password', authenticate, validators.changePassword, validate, controller.changePassword);

module.exports = router;
