const express = require('express');
const router = express.Router();
const controller = require('../controllers/setting.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', controller.getSettings);
router.put('/', isAdmin, controller.updateSettings);

module.exports = router;
