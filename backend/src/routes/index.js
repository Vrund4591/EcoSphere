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

const emissionFactorRoutes = require('./emissionFactor.routes');
const carbonTransactionRoutes = require('./carbonTransaction.routes');
const environmentalGoalRoutes = require('./environmentalGoal.routes');
const productProfileRoutes = require('./productProfile.routes');

router.use('/emission-factors', emissionFactorRoutes);
router.use('/carbon-transactions', carbonTransactionRoutes);
router.use('/environmental-goals', environmentalGoalRoutes);
router.use('/product-profiles', productProfileRoutes);

// TEAMMATES: Gamification + Reports (Samarth / P4)
const challengeRoutes = require('./challenge.routes');
const challengeParticipationRoutes = require('./challengeParticipation.routes');
const badgeRoutes = require('./badge.routes');
const rewardRoutes = require('./reward.routes');
const leaderboardRoutes = require('./leaderboard.routes');
const reportsRoutes = require('./reports.routes');

router.use('/challenges', challengeRoutes);
router.use('/challenge-participations', challengeParticipationRoutes);
router.use('/badges', badgeRoutes);
router.use('/rewards', rewardRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/reports', reportsRoutes);

// TEAMMATES: Social + Governance (Tirth / P3)
const csrActivityRoutes = require('./csrActivity.routes');
const participationRoutes = require('./participation.routes');
const socialRoutes = require('./social.routes');
const policyRoutes = require('./policy.routes');
const acknowledgementRoutes = require('./acknowledgement.routes');
const auditRoutes = require('./audit.routes');
const complianceIssueRoutes = require('./complianceIssue.routes');

router.use('/csr-activities', csrActivityRoutes);
router.use('/participations', participationRoutes);
router.use('/social', socialRoutes);
router.use('/policies', policyRoutes);
router.use('/acknowledgements', acknowledgementRoutes);
router.use('/audits', auditRoutes);
router.use('/compliance-issues', complianceIssueRoutes);

module.exports = router;
