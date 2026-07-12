const express = require('express');
const router = express.Router();
const c = require('../controllers/leaderboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/', c.getLeaderboard);

module.exports = router;
