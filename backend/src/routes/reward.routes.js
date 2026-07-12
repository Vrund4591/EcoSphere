const express = require('express');
const router = express.Router();
const c = require('../controllers/reward.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/redemptions', c.getRedemptions);
router.get('/', c.getRewards);
router.get('/:id', c.getRewardById);
router.post('/', isAdminOrManager, c.createReward);
router.put('/:id', isAdminOrManager, c.updateReward);
router.delete('/:id', isAdminOrManager, c.deleteReward);
router.post('/:id/redeem', c.redeemReward);   // any authenticated user

module.exports = router;
