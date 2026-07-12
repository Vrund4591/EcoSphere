const express = require('express');
const router = express.Router();
const controller = require('../controllers/carbonTransaction.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', controller.getCarbonTransactions);
router.get('/:id', controller.getCarbonTransactionById);
router.post('/', isAdminOrManager, controller.createCarbonTransaction);
router.post('/generate', isAdminOrManager, controller.generateTransactions);
router.put('/:id', isAdminOrManager, controller.updateCarbonTransaction);
router.delete('/:id', isAdminOrManager, controller.deleteCarbonTransaction);

module.exports = router;
