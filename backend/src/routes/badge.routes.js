const express = require('express');
const router = express.Router();
const c = require('../controllers/badge.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', c.getBadges);
router.get('/:id', c.getBadgeById);
router.post('/', isAdminOrManager, c.createBadge);
router.put('/:id', isAdminOrManager, c.updateBadge);
router.delete('/:id', isAdminOrManager, c.deleteBadge);

module.exports = router;
