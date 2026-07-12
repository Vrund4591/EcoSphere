const express = require('express');
const router = express.Router();
const c = require('../controllers/training.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/', c.list);
router.get('/completions', c.completions);
router.post('/', isAdminOrManager, c.create);
router.put('/:id', isAdminOrManager, c.update);
router.delete('/:id', isAdminOrManager, c.remove);
router.post('/:id/complete', c.complete); // any authenticated employee marks their own

module.exports = router;
