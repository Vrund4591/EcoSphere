const { body } = require('express-validator');
const { validatePassword } = require('../utils/helpers');

const passwordRule = (field) =>
  body(field)
    .notEmpty()
    .withMessage('Password is required')
    .custom((value) => {
      const { isValid, errors } = validatePassword(value);
      if (!isValid) throw new Error(errors.join('. '));
      return true;
    });

module.exports = {
  signup: [
    body('name').trim().notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').trim().notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Valid email required').normalizeEmail(),
    passwordRule('password'),
  ],
  login: [
    body('email').trim().notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    passwordRule('newPassword'),
  ],
};
