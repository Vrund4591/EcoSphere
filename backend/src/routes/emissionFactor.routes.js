const express = require('express');
const router = express.Router();
const controller = require('../controllers/emissionFactor.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', controller.getEmissionFactors);
router.get('/:id', controller.getEmissionFactorById);
router.post('/', isAdminOrManager, controller.createEmissionFactor);
router.put('/:id', isAdminOrManager, controller.updateEmissionFactor);
router.delete('/:id', isAdminOrManager, controller.deleteEmissionFactor);

module.exports = router;
