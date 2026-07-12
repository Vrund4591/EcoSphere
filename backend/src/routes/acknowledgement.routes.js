const express = require('express');
const router = express.Router();
const controller = require('../controllers/acknowledgement.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', controller.list);
router.put('/:id/remind', isAdminOrManager, controller.remind);

module.exports = router;
