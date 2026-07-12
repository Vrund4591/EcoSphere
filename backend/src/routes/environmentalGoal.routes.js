const express = require('express');
const router = express.Router();
const controller = require('../controllers/environmentalGoal.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', controller.getEnvironmentalGoals);
router.get('/:id', controller.getEnvironmentalGoalById);
router.post('/', isAdminOrManager, controller.createEnvironmentalGoal);
router.put('/:id', isAdminOrManager, controller.updateEnvironmentalGoal);
router.delete('/:id', isAdminOrManager, controller.deleteEnvironmentalGoal);

module.exports = router;
