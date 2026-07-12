const express = require('express');
const router = express.Router();
const controller = require('../controllers/policy.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', isAdminOrManager, controller.create);
router.put('/:id', isAdminOrManager, controller.update);
router.delete('/:id', isAdminOrManager, controller.remove);
router.post('/:id/acknowledge', controller.acknowledge);
router.post('/:id/remind', isAdminOrManager, controller.remind);

module.exports = router;
