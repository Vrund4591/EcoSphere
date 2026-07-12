const { body } = require('express-validator');
const { validatePassword } = require('../utils/helpers');

const ROLES = ['ADMIN', 'MANAGER', 'EMPLOYEE'];

module.exports = {
  createUser: [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().custom((v) => {
      const { isValid, errors } = validatePassword(v);
      if (!isValid) throw new Error(errors.join('. '));
      return true;
    }),
    body('role').optional().isIn(ROLES).withMessage('Invalid role'),
  ],
  updateUser: [
    body('role').optional().isIn(ROLES).withMessage('Invalid role'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  ],
};
