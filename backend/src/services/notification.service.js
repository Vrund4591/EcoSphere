const prisma = require('../config/database');

/**
 * In-app notification service (Tier 1). Email is a Tier-3 add-on.
 * Every write is best-effort — a failed notification must never break the
 * business action that triggered it.
 */
async function notify(userId, { type, title, message = '', link = null }) {
  if (!userId) return null;
  try {
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
