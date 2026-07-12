const prisma = require('../config/database');
const { isEmailConfigured, sendAlertEmail } = require('./email.service');

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

function isTypeEnabled(type, settings) {
  const field = TYPE_TO_SETTING[type];
  if (!field) return true;
  return !settings || settings[field] !== false;
}

// Fire the matching themed alert email — best-effort, never blocks or throws.
// Gated by the master "Email alerts" switch (Setting.emailAlertsComplianceIssues)
// AND server SMTP being configured. Runs after the per-type in-app gate passes.
function maybeEmail(userId, payload, settings) {
  if (!isEmailConfigured() || !settings || settings.emailAlertsComplianceIssues !== true) return;
  prisma.user
    .findUnique({ where: { id: userId }, select: { email: true, name: true, isActive: true } })
    .then((user) => {
      if (user && user.isActive !== false && user.email) sendAlertEmail({ user, ...payload });
    })
    .catch((err) => console.error('alert email lookup failed:', err.message));
}

/**
 * Notification service. In-app (Tier 1) plus optional themed email (Tier 3).
 * Delivery of each category is configurable via Settings → Notifications.
 * Every step is best-effort — a failed notification must never break the
 * triggering action.
 */
async function notify(userId, { type, title, message = '', link = null }) {
  if (!userId) return null;
  try {
    const settings = await prisma.setting.findFirst();
    if (!isTypeEnabled(type, settings)) return null;
    const notification = await prisma.notification.create({
      data: { userId, type, title, message, link },
    });
    maybeEmail(userId, { type, title, message, link }, settings);
    return notification;
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
