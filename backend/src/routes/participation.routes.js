const express = require('express');
const router = express.Router();
const c = require('../controllers/participation.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', c.list);
router.put('/:id/approve', isAdminOrManager, c.approve);
router.put('/:id/reject', isAdminOrManager, c.reject);

module.exports = router;
