const express = require('express');
const router = express.Router();
const controller = require('../controllers/category.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', controller.getCategories);
router.post('/', isAdminOrManager, controller.createCategory);
router.put('/:id', isAdminOrManager, controller.updateCategory);
router.delete('/:id', isAdminOrManager, controller.deleteCategory);

module.exports = router;
