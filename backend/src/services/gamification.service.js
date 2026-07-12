const prisma = require('../config/database');
const { notify } = require('./notification.service');

/**
 * Award XP and/or spendable points to a user, then check badge eligibility.
 * Called by: challenge-participation approval, CSR-participation approval (Tirth).
 */
async function awardXp(userId, { xp = 0, points = 0 }) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: { increment: xp },
      points: { increment: points },
    },
  });
  await checkAndAwardBadges(userId);
}

/**
 * Check all ACTIVE badges and auto-award any the user has qualified for
 * but hasn't received yet.  Respects the `autoAwardBadges` org setting.
 */
async function checkAndAwardBadges(userId) {
  const settings = await prisma.setting.findFirst();
  if (settings && !settings.autoAwardBadges) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const completed = await prisma.challengeParticipation.count({
    where: { employeeId: userId, approvalStatus: 'APPROVED' },
  });

  const badges = await prisma.badge.findMany({ where: { status: 'ACTIVE' } });

  for (const b of badges) {
    const metric = b.unlockType === 'XP' ? user.xp : completed;
    if (metric >= b.unlockThreshold) {
      const exists = await prisma.employeeBadge.findUnique({
        where: { employeeId_badgeId: { employeeId: userId, badgeId: b.id } },
      });
      if (!exists) {
        await prisma.employeeBadge.create({
          data: { employeeId: userId, badgeId: b.id },
        });
        await notify(userId, {
          type: 'BADGE_UNLOCK',
          title: 'Badge unlocked! ' + (b.icon || '🏅'),
          message: `You earned "${b.name}"`,
          link: '/gamification',
        });
      }
    }
  }
}

module.exports = { awardXp, checkAndAwardBadges };
