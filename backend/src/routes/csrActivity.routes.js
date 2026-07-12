const express = require('express');
const router = express.Router();
const c = require('../controllers/csrActivity.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');

router.use(authenticate);

router.get('/', c.list);
router.get('/:id', c.getById);
router.post('/', isAdminOrManager, c.create);
router.put('/:id', isAdminOrManager, c.update);
router.delete('/:id', isAdminOrManager, c.remove);
router.post('/:id/join', upload.single('proof'), c.join);

module.exports = router;
