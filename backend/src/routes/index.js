const express = require('express');
const router = express.Router();

// --- Platform (Lead) ---
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const departmentRoutes = require('./department.routes');
const categoryRoutes = require('./category.routes');
const settingRoutes = require('./setting.routes');
const notificationRoutes = require('./notification.routes');
const dashboardRoutes = require('./dashboard.routes');

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'EcoSphere API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/categories', categoryRoutes);
router.use('/settings', settingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);

// ============================================================
// TEAMMATES: append your module routes below (append-only — no merge conflicts).
//   P2 Environmental: /emission-factors /carbon-transactions /environmental-goals /product-profiles
//   P3 Social:        /csr-activities /participations /diversity
//   P3 Governance:    /policies /acknowledgements /audits /compliance-issues
//   P4 Gamification:  /challenges /challenge-participations /badges /rewards /leaderboard
//   P4 Reports:       /reports
//
// Pattern (clone department.controller.js + department.routes.js):
//   const emissionFactorRoutes = require('./emissionFactor.routes');
//   router.use('/emission-factors', emissionFactorRoutes);
// ============================================================

module.exports = router;
