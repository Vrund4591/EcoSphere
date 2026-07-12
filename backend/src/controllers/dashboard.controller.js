const prisma = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');
const { computeAllScores } = require('../services/scoring.service');

/** Build a 12-month emissions trend (kgCO2e per month), oldest -> newest */
async function emissionsTrend() {
  const start = new Date();
  start.setMonth(start.getMonth() - 11);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const txns = await prisma.carbonTransaction.findMany({
    where: { date: { gte: start } },
    select: { date: true, co2Amount: true },
  });

  const buckets = [];
  const keyFor = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const labels = new Map();
  for (let i = 0; i < 12; i++) {
    const d = new Date(start);
    d.setMonth(start.getMonth() + i);
    const key = keyFor(d);
    labels.set(key, { month: d.toLocaleString('en', { month: 'short' }), key, co2: 0 });
    buckets.push(key);
  }
  for (const t of txns) {
    const key = keyFor(new Date(t.date));
    if (labels.has(key)) labels.get(key).co2 += t.co2Amount;
  }
  return buckets.map((k) => {
    const b = labels.get(k);
    return { month: b.month, co2: Math.round(b.co2) };
  });
}

/** Merge a few tables into a recent-activity feed */
async function recentActivity() {
  const [carbon, issues, participations, badges] = await Promise.all([
    prisma.carbonTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { department: { select: { name: true } } },
    }),
    prisma.complianceIssue.findMany({
      orderBy: { createdAt: 'desc' },
      take: 2,
      include: { owner: { select: { name: true } } },
    }),
    prisma.employeeParticipation.findMany({
      where: { approvalStatus: 'APPROVED' },
      orderBy: { updatedAt: 'desc' },
      take: 2,
      include: { employee: { select: { name: true } }, activity: { select: { title: true } } },
    }),
    prisma.employeeBadge.findMany({
      orderBy: { awardedAt: 'desc' },
      take: 2,
      include: { employee: { select: { name: true } }, badge: { select: { name: true, icon: true } } },
    }),
  ]);

  const feed = [
    ...carbon.map((c) => ({
      type: 'CARBON',
      icon: '',
      text: `${Math.round(c.co2Amount)} kgCO₂e logged${c.department ? ` in ${c.department.name}` : ''}`,
      at: c.createdAt,
    })),
    ...issues.map((i) => ({
      type: 'ISSUE',
      icon: '',
      text: `Compliance issue "${i.title}" (${i.severity})`,
      at: i.createdAt,
    })),
    ...participations.map((p) => ({
      type: 'CSR',
      icon: '',
      text: `${p.employee?.name || 'Employee'} completed "${p.activity?.title || 'CSR activity'}"`,
      at: p.updatedAt,
    })),
    ...badges.map((b) => ({
      type: 'BADGE',
      icon: b.badge?.icon || '',
      text: `${b.employee?.name || 'Employee'} unlocked "${b.badge?.name || 'a badge'}"`,
      at: b.awardedAt,
    })),
  ];
  return feed.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);
}

/** GET /api/dashboard */
const getDashboard = async (req, res, next) => {
  try {
    const [scores, agg, activeChallenges, openIssues, overdueIssues, csrCount, pendingCsr, employees, badgesAwarded, trend, activity] =
      await Promise.all([
        computeAllScores(),
        prisma.carbonTransaction.aggregate({ _sum: { co2Amount: true } }),
        prisma.challenge.count({ where: { status: 'ACTIVE' } }),
        prisma.complianceIssue.count({ where: { status: { not: 'RESOLVED' } } }),
        prisma.complianceIssue.count({
          where: { status: { not: 'RESOLVED' }, dueDate: { lt: new Date() } },
        }),
        prisma.cSRActivity.count(),
        prisma.employeeParticipation.count({ where: { approvalStatus: 'PENDING' } }),
        prisma.user.count({ where: { isActive: true } }),
        prisma.employeeBadge.count(),
        emissionsTrend(),
        recentActivity(),
      ]);

    res.json(
      new ApiResponse(
        200,
        {
          scores, // { overall, environmental, social, governance, weights, departments[] }
          kpis: {
            totalCo2: Math.round(agg._sum.co2Amount || 0),
            activeChallenges,
            openIssues,
            overdueIssues,
            csrActivities: csrCount,
            pendingApprovals: pendingCsr,
            totalEmployees: employees,
            badgesAwarded,
          },
          emissionsTrend: trend,
          departmentRanking: scores.departments,
          recentActivity: activity,
        },
        'Dashboard data retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
};

/** POST /api/dashboard/recompute — force a score recompute */
const recompute = async (req, res, next) => {
  try {
    const scores = await computeAllScores();
    res.json(new ApiResponse(200, { scores }, 'Scores recomputed'));
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, recompute };
