const prisma = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');

/** GET /api/notifications — current user's notifications (newest first) */
const getMyNotifications = async (req, res, next) => {
  try {
    const [notifications, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({ where: { userId: req.user.id, read: false } }),
    ]);
    res.json(new ApiResponse(200, { notifications, unread }, 'Notifications retrieved'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/notifications/:id/read */
const markRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { read: true },
    });
    res.json(new ApiResponse(200, null, 'Marked as read'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/notifications/read-all */
const markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });
    res.json(new ApiResponse(200, null, 'All marked as read'));
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyNotifications, markRead, markAllRead };
