const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, paginated } = require('../utils/helpers');
const { awardXp } = require('../services/gamification.service');
const { notify, notifyAdmins } = require('../services/notification.service');

const INCLUDE = {
  challenge: { select: { id: true, title: true, xp: true, difficulty: true } },
  employee: { select: { id: true, name: true, email: true } },
};

/** GET /api/challenge-participations */
const getParticipations = async (req, res, next) => {
  try {
    const { page, limit, status, challengeId, employeeId, all } = req.query;
    const where = {};
    if (status) where.approvalStatus = status;
    if (challengeId) where.challengeId = challengeId;
    // Employees can only see their own participations
    if (req.user.role === 'EMPLOYEE') {
      where.employeeId = req.user.id;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (all === 'true') {
      const participations = await prisma.challengeParticipation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: INCLUDE,
      });
      return res.json(new ApiResponse(200, { participations }, 'Participations retrieved'));
    }

    const { page: p, limit: l, skip } = getPagination(page, limit);
    const [participations, total] = await Promise.all([
      prisma.challengeParticipation.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: INCLUDE,
      }),
      prisma.challengeParticipation.count({ where }),
    ]);
    res.json(new ApiResponse(200, paginated(participations, total, p, l), 'Participations retrieved'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/challenge-participations/:id */
const getParticipationById = async (req, res, next) => {
  try {
    const participation = await prisma.challengeParticipation.findUnique({
      where: { id: req.params.id },
      include: INCLUDE,
    });
    if (!participation) throw ApiError.notFound('Participation not found');
    res.json(new ApiResponse(200, { participation }, 'Participation retrieved'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/challenge-participations/:id — update progress/proof */
const updateParticipation = async (req, res, next) => {
  try {
    const { progress, proof } = req.body;
    const existing = await prisma.challengeParticipation.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) throw ApiError.notFound('Participation not found');
    // Employees can only update their own
    if (req.user.role === 'EMPLOYEE' && existing.employeeId !== req.user.id) {
      throw ApiError.forbidden('Not your participation');
    }
    const participation = await prisma.challengeParticipation.update({
      where: { id: req.params.id },
      data: {
        ...(progress !== undefined && { progress: Number(progress) }),
        ...(proof !== undefined && { proof }),
      },
      include: INCLUDE,
    });
    res.json(new ApiResponse(200, { participation }, 'Participation updated'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/challenge-participations/:id/approve */
const approveParticipation = async (req, res, next) => {
  try {
    const existing = await prisma.challengeParticipation.findUnique({
      where: { id: req.params.id },
      include: { challenge: true, employee: { select: { id: true, name: true } } },
    });
    if (!existing) throw ApiError.notFound('Participation not found');
    if (existing.approvalStatus !== 'PENDING') {
      throw ApiError.badRequest('Participation is not pending approval');
    }

    const xpAmount = existing.challenge.xp;
    const participation = await prisma.challengeParticipation.update({
      where: { id: req.params.id },
      data: {
        approvalStatus: 'APPROVED',
        xpAwarded: xpAmount,
        approverId: req.user.id,
      },
      include: INCLUDE,
    });

    // Award XP and points (equal to challenge XP), then auto-check badges
    await awardXp(existing.employeeId, { xp: xpAmount, points: xpAmount });

    // Notify the employee
    await notify(existing.employeeId, {
      type: 'CHALLENGE_APPROVED',
      title: 'Challenge Approved!',
      message: `Your participation in "${existing.challenge.title}" was approved. +${xpAmount} XP awarded!`,
      link: '/gamification',
    });

    res.json(new ApiResponse(200, { participation }, 'Participation approved and XP awarded'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/challenge-participations/:id/reject */
const rejectParticipation = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const existing = await prisma.challengeParticipation.findUnique({
      where: { id: req.params.id },
      include: { challenge: { select: { title: true } } },
    });
    if (!existing) throw ApiError.notFound('Participation not found');
    if (existing.approvalStatus !== 'PENDING') {
      throw ApiError.badRequest('Participation is not pending approval');
    }

    const participation = await prisma.challengeParticipation.update({
      where: { id: req.params.id },
      data: {
        approvalStatus: 'REJECTED',
        approverId: req.user.id,
      },
      include: INCLUDE,
    });

    await notify(existing.employeeId, {
      type: 'CHALLENGE_REJECTED',
      title: 'Challenge Rejected',
      message: `Your participation in "${existing.challenge.title}" was rejected.${reason ? ' Reason: ' + reason : ''}`,
      link: '/gamification',
    });

    res.json(new ApiResponse(200, { participation }, 'Participation rejected'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getParticipations,
  getParticipationById,
  updateParticipation,
  approveParticipation,
  rejectParticipation,
};
