const express = require('express');
const router = express.Router();
const controller = require('../controllers/productProfile.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', controller.getProductProfiles);
router.get('/:id', controller.getProductProfileById);
router.post('/', isAdminOrManager, controller.createProductProfile);
router.put('/:id', isAdminOrManager, controller.updateProductProfile);
router.delete('/:id', isAdminOrManager, controller.deleteProductProfile);

module.exports = router;
