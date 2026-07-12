const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, paginated } = require('../utils/helpers');

/** GET /api/badges */
const getBadges = async (req, res, next) => {
  try {
    const { page, limit, all } = req.query;
    const where = {};

    // Include earned status for the current user
    const userId = req.user.id;

    if (all === 'true') {
      const badges = await prisma.badge.findMany({
        orderBy: { unlockThreshold: 'asc' },
        include: {
          employeeBadges: {
            where: { employeeId: userId },
            select: { awardedAt: true },
          },
        },
      });
      return res.json(new ApiResponse(200, { badges }, 'Badges retrieved'));
    }

    const { page: p, limit: l, skip } = getPagination(page, limit);
    const [badges, total] = await Promise.all([
      prisma.badge.findMany({
        skip,
        take: l,
        orderBy: { unlockThreshold: 'asc' },
        include: {
          employeeBadges: {
            where: { employeeId: userId },
            select: { awardedAt: true },
          },
        },
      }),
      prisma.badge.count({}),
    ]);
    res.json(new ApiResponse(200, paginated(badges, total, p, l), 'Badges retrieved'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/badges/:id */
const getBadgeById = async (req, res, next) => {
  try {
    const badge = await prisma.badge.findUnique({
      where: { id: req.params.id },
      include: {
        employeeBadges: {
          include: { employee: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    if (!badge) throw ApiError.notFound('Badge not found');
    res.json(new ApiResponse(200, { badge }, 'Badge retrieved'));
  } catch (err) {
    next(err);
  }
};

/** POST /api/badges */
const createBadge = async (req, res, next) => {
  try {
    const { name, description, icon, unlockType, unlockThreshold, status } = req.body;
    if (!name) throw ApiError.badRequest('Name is required');
    const badge = await prisma.badge.create({
      data: {
        name,
        description: description || null,
        icon: icon || null,
        unlockType: unlockType || 'XP',
        unlockThreshold: Number(unlockThreshold) || 0,
        status: status || 'ACTIVE',
      },
    });
    res.status(201).json(new ApiResponse(201, { badge }, 'Badge created'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/badges/:id */
const updateBadge = async (req, res, next) => {
  try {
    const { name, description, icon, unlockType, unlockThreshold, status } = req.body;
    const badge = await prisma.badge.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(unlockType && { unlockType }),
        ...(unlockThreshold !== undefined && { unlockThreshold: Number(unlockThreshold) }),
        ...(status && { status }),
      },
    });
    res.json(new ApiResponse(200, { badge }, 'Badge updated'));
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/badges/:id */
const deleteBadge = async (req, res, next) => {
  try {
    const existing = await prisma.badge.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound('Badge not found');
    await prisma.badge.delete({ where: { id: req.params.id } });
    res.json(new ApiResponse(200, null, 'Badge deleted'));
  } catch (err) {
    next(err);
  }
};

module.exports = { getBadges, getBadgeById, createBadge, updateBadge, deleteBadge };
