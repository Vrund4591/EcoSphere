const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, paginated } = require('../utils/helpers');
const { getOrCreateSettings } = require('../controllers/setting.controller');
const { awardXp } = require('../services/gamification.service');
const { notify } = require('../services/notification.service');

/** GET /api/participations */
const list = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const where = status ? { approvalStatus: status } : {};

    const { page: p, limit: l, skip } = getPagination(page, limit);
    const [participations, total] = await Promise.all([
      prisma.employeeParticipation.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: { select: { id: true, name: true, email: true, avatar: true } },
          activity: { select: { id: true, title: true, pointsValue: true } },
        },
      }),
      prisma.employeeParticipation.count({ where }),
    ]);
    res.json(new ApiResponse(200, paginated(participations, total, p, l), 'Participations retrieved'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/participations/:id/approve */
const approve = async (req, res, next) => {
  try {
    const participation = await prisma.employeeParticipation.findUnique({
      where: { id: req.params.id },
      include: { activity: true },
    });
    if (!participation) throw ApiError.notFound('Participation not found');
    if (participation.approvalStatus !== 'PENDING') {
      throw ApiError.badRequest(`Participation already ${participation.approvalStatus.toLowerCase()}`);
    }

    // Check evidence requirement from org settings
    const settings = await getOrCreateSettings();
    if (settings.evidenceRequiredForCSR && !participation.proof) {
      throw ApiError.badRequest('Evidence (proof) is required before approval');
    }

    const updated = await prisma.employeeParticipation.update({
      where: { id: req.params.id },
      data: {
        approvalStatus: 'APPROVED',
        pointsEarned: participation.activity.pointsValue,
        completionDate: new Date(),
        approverId: req.user.id,
      },
      include: {
        employee: { select: { id: true, name: true, email: true, avatar: true } },
        activity: { select: { id: true, title: true, pointsValue: true } },
      },
    });

    // Award XP & points
    await awardXp(participation.employeeId, {
      xp: participation.activity.pointsValue,
      points: participation.activity.pointsValue,
    });

    // Notify the employee
    await notify(participation.employeeId, {
      type: 'CSR_APPROVAL',
      title: 'CSR Participation Approved!',
      message:
        'Your participation in "' +
        participation.activity.title +
        '" has been approved. You earned ' +
        participation.activity.pointsValue +
        ' XP & points!',
      link: '/social',
    });

    res.json(new ApiResponse(200, { participation: updated }, 'Participation approved'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/participations/:id/reject */
const reject = async (req, res, next) => {
  try {
    const participation = await prisma.employeeParticipation.findUnique({
      where: { id: req.params.id },
      include: { activity: true },
    });
    if (!participation) throw ApiError.notFound('Participation not found');
    if (participation.approvalStatus !== 'PENDING') {
      throw ApiError.badRequest(`Participation already ${participation.approvalStatus.toLowerCase()}`);
    }

    const updated = await prisma.employeeParticipation.update({
      where: { id: req.params.id },
      data: {
        approvalStatus: 'REJECTED',
        approverId: req.user.id,
      },
      include: {
        employee: { select: { id: true, name: true, email: true, avatar: true } },
        activity: { select: { id: true, title: true, pointsValue: true } },
      },
    });

    // Notify the employee
    await notify(participation.employeeId, {
      type: 'CSR_REJECTION',
      title: 'CSR Participation Rejected',
      message:
        'Your participation in "' +
        participation.activity.title +
        '" has been rejected. Contact your manager for details.',
      link: '/social',
    });

    res.json(new ApiResponse(200, { participation: updated }, 'Participation rejected'));
  } catch (err) {
    next(err);
  }
};

module.exports = { list, approve, reject };
