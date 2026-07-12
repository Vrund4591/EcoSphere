const express = require('express');
const router = express.Router();
const controller = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', controller.getMyNotifications);
router.put('/read-all', controller.markAllRead);
router.put('/:id/read', controller.markRead);

module.exports = router;
