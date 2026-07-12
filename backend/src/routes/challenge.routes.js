const express = require('express');
const router = express.Router();
const c = require('../controllers/challenge.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', c.getChallenges);
router.get('/:id', c.getChallengeById);
router.post('/', isAdminOrManager, c.createChallenge);
router.put('/:id', isAdminOrManager, c.updateChallenge);
router.put('/:id/status', isAdminOrManager, c.updateChallengeStatus);
router.post('/:id/join', c.joinChallenge);   // any authenticated user
router.delete('/:id', isAdminOrManager, c.deleteChallenge);

module.exports = router;
