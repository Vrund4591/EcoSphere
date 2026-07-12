const express = require('express');
const router = express.Router();
const controller = require('../controllers/user.controller');
const validators = require('../validators/user.validator');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

router.use(authenticate);

// Readable by any authenticated user (dropdowns, owner selection, leaderboard joins)
router.get('/', controller.getUsers);
router.get('/:id', controller.getUserById);

// Admin-only management
router.post('/', isAdmin, validators.createUser, validate, controller.createUser);
router.put('/:id', isAdmin, validators.updateUser, validate, controller.updateUser);
router.delete('/:id', isAdmin, controller.deleteUser);

module.exports = router;
