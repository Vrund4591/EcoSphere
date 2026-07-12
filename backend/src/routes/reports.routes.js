const express = require('express');
const router = express.Router();
const c = require('../controllers/reports.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');

router.use(authenticate, isAdminOrManager);

router.get('/environmental', c.environmentalReport);
router.get('/social', c.socialReport);
router.get('/governance', c.governanceReport);
router.get('/summary', c.summaryReport);
router.get('/custom', c.customReport);

module.exports = router;
