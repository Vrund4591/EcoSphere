const prisma = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');

/** GET /api/reports/environmental */
const environmentalReport = async (req, res, next) => {
  try {
    const { startDate, endDate, department } = req.query;
    const where = {};
    if (department) where.departmentId = department;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [transactions, goals, total] = await Promise.all([
      prisma.carbonTransaction.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          emissionFactor: { select: { name: true, unit: true } },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.environmentalGoal.findMany({
        where: department ? { departmentId: department } : {},
        include: { department: { select: { id: true, name: true } } },
      }),
      prisma.carbonTransaction.aggregate({
        where,
        _sum: { co2Amount: true, quantity: true },
        _count: true,
      }),
    ]);

    // Group by source
    const bySource = await prisma.carbonTransaction.groupBy({
      by: ['source'],
      where,
      _sum: { co2Amount: true },
      _count: true,
    });

    res.json(
      new ApiResponse(
        200,
        {
          summary: {
            totalCo2: total._sum.co2Amount || 0,
            totalTransactions: total._count,
          },
          bySource,
          transactions,
          goals,
        },
        'Environmental report generated'
      )
    );
  } catch (err) {
    next(err);
  }
};

/** GET /api/reports/social */
const socialReport = async (req, res, next) => {
  try {
    const { startDate, endDate, department } = req.query;
    const participationWhere = {};
    if (startDate || endDate) {
      participationWhere.createdAt = {};
      if (startDate) participationWhere.createdAt.gte = new Date(startDate);
      if (endDate) participationWhere.createdAt.lte = new Date(endDate);
    }

    const [activities, participations, summary] = await Promise.all([
      prisma.cSRActivity.findMany({
        include: {
          category: { select: { name: true } },
          _count: { select: { participations: true } },
        },
      }),
      prisma.employeeParticipation.findMany({
        where: participationWhere,
        include: {
          activity: { select: { title: true, pointsValue: true } },
          employee: {
            select: {
              id: true,
              name: true,
              department: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.employeeParticipation.aggregate({
        where: participationWhere,
        _sum: { pointsEarned: true },
        _count: true,
      }),
    ]);

    const byStatus = {
      PENDING: participations.filter((p) => p.approvalStatus === 'PENDING').length,
      APPROVED: participations.filter((p) => p.approvalStatus === 'APPROVED').length,
      REJECTED: participations.filter((p) => p.approvalStatus === 'REJECTED').length,
    };

    res.json(
      new ApiResponse(
        200,
        { summary: { total: summary._count, totalPoints: summary._sum.pointsEarned || 0, byStatus }, activities, participations },
        'Social report generated'
      )
    );
  } catch (err) {
    next(err);
  }
};

/** GET /api/reports/governance */
const governanceReport = async (req, res, next) => {
  try {
    const { startDate, endDate, department } = req.query;
    const auditWhere = department ? { departmentId: department } : {};

    const [policies, audits, issues, ackSummary] = await Promise.all([
      prisma.eSGPolicy.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.audit.findMany({
        where: auditWhere,
        include: {
          department: { select: { id: true, name: true } },
          _count: { select: { issues: true } },
        },
      }),
      prisma.complianceIssue.findMany({
        include: {
          owner: { select: { id: true, name: true } },
          audit: { select: { id: true, title: true } },
        },
      }),
      prisma.policyAcknowledgement.aggregate({
        _count: true,
      }),
    ]);

    const issuesByStatus = {
      OPEN: issues.filter((i) => i.status === 'OPEN').length,
      IN_PROGRESS: issues.filter((i) => i.status === 'IN_PROGRESS').length,
      RESOLVED: issues.filter((i) => i.status === 'RESOLVED').length,
    };

    res.json(
      new ApiResponse(
        200,
        {
          summary: { totalPolicies: policies.length, totalAudits: audits.length, totalIssues: issues.length, issuesByStatus, totalAcknowledgements: ackSummary._count },
          policies,
          audits,
          issues,
        },
        'Governance report generated'
      )
    );
  } catch (err) {
    next(err);
  }
};

/** GET /api/reports/summary — ESG Summary across all modules */
const summaryReport = async (req, res, next) => {
  try {
    const [
      co2Total,
      csrTotal,
      challengeTotal,
      userCount,
      badgeTotal,
      rewardTotal,
      policyTotal,
      issueTotal,
    ] = await Promise.all([
      prisma.carbonTransaction.aggregate({ _sum: { co2Amount: true }, _count: true }),
      prisma.employeeParticipation.count({ where: { approvalStatus: 'APPROVED' } }),
      prisma.challengeParticipation.count({ where: { approvalStatus: 'APPROVED' } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.employeeBadge.count(),
      prisma.rewardRedemption.count(),
      prisma.eSGPolicy.count({ where: { status: 'ACTIVE' } }),
      prisma.complianceIssue.count({ where: { status: { not: 'RESOLVED' } } }),
    ]);

    // Top 5 users by XP
    const topUsers = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { xp: 'desc' },
      take: 5,
      select: { id: true, name: true, xp: true, points: true },
    });

    res.json(
      new ApiResponse(
        200,
        {
          environmental: {
            totalCo2: co2Total._sum.co2Amount || 0,
            totalTransactions: co2Total._count,
          },
          social: { approvedParticipations: csrTotal, activeUsers: userCount },
          governance: { activePolicies: policyTotal, openIssues: issueTotal },
          gamification: {
            completedChallenges: challengeTotal,
            badgesAwarded: badgeTotal,
            rewardsRedeemed: rewardTotal,
          },
          topUsers,
        },
        'ESG Summary report generated'
      )
    );
  } catch (err) {
    next(err);
  }
};

/** GET /api/reports/custom — flexible filter-based report */
const customReport = async (req, res, next) => {
  try {
    const { department, startDate, endDate, module, employee, challenge, category } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    let rows = [];

    if (!module || module === 'environmental') {
      const where = {};
      if (department) where.departmentId = department;
      if (Object.keys(dateFilter).length) where.date = dateFilter;
      const txs = await prisma.carbonTransaction.findMany({
        where,
        include: {
          department: { select: { name: true } },
          emissionFactor: { select: { name: true, unit: true } },
        },
      });
      rows.push(
        ...txs.map((t) => ({
          module: 'Environmental',
          date: t.date?.toISOString().split('T')[0] || '',
          department: t.department?.name || '',
          description: t.description || t.source,
          quantity: t.quantity,
          co2Amount: t.co2Amount,
          emissionFactor: t.emissionFactor?.name || '',
        }))
      );
    }

    if (!module || module === 'social') {
      const where = {};
      if (employee) where.employeeId = employee;
      if (Object.keys(dateFilter).length) where.createdAt = dateFilter;
      const parts = await prisma.employeeParticipation.findMany({
        where,
        include: {
          activity: { select: { title: true, category: { select: { name: true } } } },
          employee: { select: { name: true, department: { select: { name: true } } } },
        },
      });
      rows.push(
        ...parts.map((p) => ({
          module: 'Social',
          date: p.createdAt?.toISOString().split('T')[0] || '',
          department: p.employee?.department?.name || '',
          employee: p.employee?.name || '',
          activity: p.activity?.title || '',
          category: p.activity?.category?.name || '',
          status: p.approvalStatus,
          pointsEarned: p.pointsEarned,
        }))
      );
    }

    if (!module || module === 'governance') {
      const issueWhere = {};
      if (Object.keys(dateFilter).length) issueWhere.createdAt = dateFilter;
      const issues = await prisma.complianceIssue.findMany({
        where: issueWhere,
        include: { owner: { select: { name: true } } },
      });
      rows.push(
        ...issues.map((i) => ({
          module: 'Governance',
          date: i.createdAt?.toISOString().split('T')[0] || '',
          title: i.title,
          severity: i.severity,
          status: i.status,
          owner: i.owner?.name || '',
          dueDate: i.dueDate?.toISOString().split('T')[0] || '',
        }))
      );
    }

    if (!module || module === 'gamification') {
      const where = {};
      if (employee) where.employeeId = employee;
      if (challenge) where.challengeId = challenge;
      if (Object.keys(dateFilter).length) where.createdAt = dateFilter;
      const participations = await prisma.challengeParticipation.findMany({
        where,
        include: {
          challenge: {
            select: {
              title: true,
              xp: true,
              difficulty: true,
              category: { select: { name: true } },
            },
          },
          employee: { select: { name: true, department: { select: { name: true } } } },
        },
      });
      rows.push(
        ...participations.map((p) => ({
          module: 'Gamification',
          date: p.createdAt?.toISOString().split('T')[0] || '',
          department: p.employee?.department?.name || '',
          employee: p.employee?.name || '',
          challenge: p.challenge?.title || '',
          category: p.challenge?.category?.name || '',
          difficulty: p.challenge?.difficulty || '',
          status: p.approvalStatus,
          xpAwarded: p.xpAwarded,
        }))
      );
    }

    res.json(new ApiResponse(200, { rows, total: rows.length }, 'Custom report generated'));
  } catch (err) {
    next(err);
  }
};

module.exports = { environmentalReport, socialReport, governanceReport, summaryReport, customReport };
