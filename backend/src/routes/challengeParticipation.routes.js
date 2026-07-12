const express = require('express');
const router = express.Router();
const c = require('../controllers/challengeParticipation.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', c.getParticipations);
router.get('/:id', c.getParticipationById);
router.put('/:id', c.updateParticipation);              // employee updates progress/proof
router.put('/:id/approve', isAdminOrManager, c.approveParticipation);
router.put('/:id/reject', isAdminOrManager, c.rejectParticipation);

module.exports = router;
