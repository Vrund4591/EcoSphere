const express = require('express');
const router = express.Router();
const controller = require('../controllers/complianceIssue.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin, isAdminOrManager } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', isAdminOrManager, controller.create);
router.put('/:id', isAdminOrManager, controller.update);
router.delete('/:id', isAdmin, controller.remove);

module.exports = router;
