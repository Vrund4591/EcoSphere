const prisma = require('../config/database');

// Maps a notification type to the Setting toggle that gates it (in-app).
// Types not listed here (e.g. REWARD_REDEEMED) are always delivered.
const TYPE_TO_SETTING = {
  COMPLIANCE_ISSUE: 'notifyComplianceIssue',
  CSR_APPROVAL: 'notifyApprovals',
  CSR_REJECTION: 'notifyApprovals',
  CHALLENGE_APPROVED: 'notifyApprovals',
  CHALLENGE_REJECTED: 'notifyApprovals',
  POLICY_REMINDER: 'notifyPolicyReminders',
  BADGE_UNLOCK: 'notifyBadgeUnlocks',
};

async function isTypeEnabled(type) {
  const field = TYPE_TO_SETTING[type];
  if (!field) return true;
  const settings = await prisma.setting.findFirst();
  return !settings || settings[field] !== false;
}

/**
 * In-app notification service (Tier 1). Delivery of each category is
 * configurable via Settings → Notification Settings. Every write is
 * best-effort — a failed notification must never break the triggering action.
 */
async function notify(userId, { type, title, message = '', link = null }) {
  if (!userId) return null;
  try {
    if (!(await isTypeEnabled(type))) return null;
    return await prisma.notification.create({
      data: { userId, type, title, message, link },
    });
  } catch (err) {
    console.error('notify failed:', err.message);
    return null;
  }
}

async function notifyMany(userIds, payload) {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  return Promise.all(ids.map((id) => notify(id, payload)));
}

/** Notify every active admin — used for compliance issues, etc. */
async function notifyAdmins(payload) {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true },
  });
  return notifyMany(admins.map((a) => a.id), payload);
}

module.exports = { notify, notifyMany, notifyAdmins };
