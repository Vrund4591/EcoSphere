const express = require('express');
const router = express.Router();
const controller = require('../controllers/department.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', controller.getDepartments);
router.get('/:id', controller.getDepartmentById);
router.post('/', isAdminOrManager, controller.createDepartment);
router.put('/:id', isAdminOrManager, controller.updateDepartment);
router.delete('/:id', isAdminOrManager, controller.deleteDepartment);

module.exports = router;
