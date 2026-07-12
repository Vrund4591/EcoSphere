const express = require('express');
const router = express.Router();
const controller = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', controller.getDashboard);
router.post('/recompute', controller.recompute);

module.exports = router;
