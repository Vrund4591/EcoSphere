const prisma = require('../config/database');

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const round = (n) => Math.round(n);

/**
 * Per-department E/S/G sub-scores (0-100). Formulas are intentionally simple
 * and data-driven, with neutral fallbacks so departments without data still
 * produce believable numbers. Tune freely.
 */
async function computeDepartmentSubScores(dept) {
  const memberIds = dept.members.map((m) => m.id);
  const memberCount = memberIds.length;

  // Environmental: average goal progress (currentCo2 / targetCo2)
  const goals = await prisma.environmentalGoal.findMany({ where: { departmentId: dept.id } });
  let env = 60;
  if (goals.length) {
    const avg =
      goals.reduce(
        (s, g) => s + clamp(g.targetCo2 > 0 ? (g.currentCo2 / g.targetCo2) * 100 : 0),
        0
      ) / goals.length;
    env = avg;
  }

  // Social: approved CSR participation rate (+ up to +10 diversity bonus)
  let social = 55;
  if (memberCount) {
    const approved = await prisma.employeeParticipation.count({
      where: { employeeId: { in: memberIds }, approvalStatus: 'APPROVED' },
    });
    const base = clamp((approved / memberCount) * 100);
    const disclosed = dept.members.filter((m) => m.gender && m.gender !== 'UNDISCLOSED').length;
    const diversityBonus = memberCount ? (disclosed / memberCount) * 10 : 0;
    social = clamp(base + diversityBonus);
  }

  // Governance: mean of (policy-ack rate, issue-resolved rate, audit-completed rate)
  const parts = [];
  if (memberCount) {
    const [ackTotal, ackDone] = await Promise.all([
      prisma.policyAcknowledgement.count({ where: { employeeId: { in: memberIds } } }),
      prisma.policyAcknowledgement.count({
        where: { employeeId: { in: memberIds }, status: 'ACKNOWLEDGED' },
      }),
    ]);
    if (ackTotal) parts.push(ackDone / ackTotal);

    const [issTotal, issResolved] = await Promise.all([
      prisma.complianceIssue.count({ where: { ownerId: { in: memberIds } } }),
      prisma.complianceIssue.count({ where: { ownerId: { in: memberIds }, status: 'RESOLVED' } }),
    ]);
    if (issTotal) parts.push(issResolved / issTotal);
  }
  const [audTotal, audDone] = await Promise.all([
    prisma.audit.count({ where: { departmentId: dept.id } }),
    prisma.audit.count({ where: { departmentId: dept.id, status: 'COMPLETED' } }),
  ]);
  if (audTotal) parts.push(audDone / audTotal);
  const gov = parts.length ? clamp((parts.reduce((a, b) => a + b, 0) / parts.length) * 100) : 65;

  return { env: round(env), social: round(social), gov: round(gov) };
}

/**
 * Recompute every department score + the overall ESG score, and persist a
 * DepartmentScore row per department. Returns the full breakdown.
 */
async function computeAllScores() {
  const settings = (await prisma.setting.findFirst()) || {
    weightEnv: 40,
    weightSocial: 30,
    weightGov: 30,
  };
  const w = { env: settings.weightEnv, social: settings.weightSocial, gov: settings.weightGov };
  const wsum = w.env + w.social + w.gov || 100;

  const departments = await prisma.department.findMany({
    include: { members: { select: { id: true, gender: true } } },
  });

  const results = [];
  for (const dept of departments) {
    const s = await computeDepartmentSubScores(dept);
    const total = round((s.env * w.env + s.social * w.social + s.gov * w.gov) / wsum);

    const data = {
      environmentalScore: s.env,
      socialScore: s.social,
      governanceScore: s.gov,
      totalScore: total,
      computedAt: new Date(),
    };
    const existing = await prisma.departmentScore.findFirst({ where: { departmentId: dept.id } });
    if (existing) {
      await prisma.departmentScore.update({ where: { id: existing.id }, data });
    } else {
      await prisma.departmentScore.create({ data: { departmentId: dept.id, ...data } });
    }

    results.push({
      departmentId: dept.id,
      name: dept.name,
      code: dept.code,
      memberCount: dept.members.length,
      environmental: s.env,
      social: s.social,
      governance: s.gov,
      total,
    });
  }

  // Overall = employee-count-weighted average of department scores
  const totalMembers = results.reduce((s, r) => s + r.memberCount, 0);
  const wavg = (key) => {
    if (!results.length) return 0;
    if (totalMembers > 0) {
      return round(results.reduce((s, r) => s + r[key] * r.memberCount, 0) / totalMembers);
    }
    return round(results.reduce((s, r) => s + r[key], 0) / results.length);
  };

  return {
    weights: w,
    overall: wavg('total'),
    environmental: wavg('environmental'),
    social: wavg('social'),
    governance: wavg('governance'),
    departments: results.sort((a, b) => b.total - a.total),
  };
}

module.exports = { computeAllScores, computeDepartmentSubScores };
