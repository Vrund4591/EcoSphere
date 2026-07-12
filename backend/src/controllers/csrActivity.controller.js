const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, paginated } = require('../utils/helpers');

const INCLUDE = {
  category: { select: { id: true, name: true } },
  _count: { select: { participations: true } },
};

/** GET /api/csr-activities */
const list = async (req, res, next) => {
  try {
    const { page, limit, search, all } = req.query;
    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { location: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    // `all=true` returns the full list (handy for dropdowns)
    if (all === 'true') {
      const activities = await prisma.cSRActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: INCLUDE,
      });
      return res.json(new ApiResponse(200, { activities }, 'CSR activities retrieved'));
    }

    const { page: p, limit: l, skip } = getPagination(page, limit);
    const [activities, total] = await Promise.all([
      prisma.cSRActivity.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: INCLUDE,
      }),
      prisma.cSRActivity.count({ where }),
    ]);
    res.json(new ApiResponse(200, paginated(activities, total, p, l), 'CSR activities retrieved'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/csr-activities/:id */
const getById = async (req, res, next) => {
  try {
    const activity = await prisma.cSRActivity.findUnique({
      where: { id: req.params.id },
      include: {
        category: { select: { id: true, name: true } },
        participations: {
          include: {
            employee: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    if (!activity) throw ApiError.notFound('CSR activity not found');
    res.json(new ApiResponse(200, { activity }, 'CSR activity retrieved'));
  } catch (err) {
    next(err);
  }
};

/** POST /api/csr-activities */
const create = async (req, res, next) => {
  try {
    const { title, description, date, location, pointsValue, evidenceRequired, status, categoryId } = req.body;
    if (!title) throw ApiError.badRequest('Title is required');

    const activity = await prisma.cSRActivity.create({
      data: {
        title,
        description: description || null,
        date: date ? new Date(date) : null,
        location: location || null,
        pointsValue: pointsValue ? Number(pointsValue) : 0,
        evidenceRequired: evidenceRequired ?? false,
        status: status || 'OPEN',
        categoryId: categoryId || null,
      },
      include: INCLUDE,
    });
    res.status(201).json(new ApiResponse(201, { activity }, 'CSR activity created'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/csr-activities/:id */
const update = async (req, res, next) => {
  try {
    const { title, description, date, location, pointsValue, evidenceRequired, status, categoryId } = req.body;

    const activity = await prisma.cSRActivity.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(date !== undefined && { date: date ? new Date(date) : null }),
        ...(location !== undefined && { location: location || null }),
        ...(pointsValue !== undefined && { pointsValue: Number(pointsValue) }),
        ...(evidenceRequired !== undefined && { evidenceRequired }),
        ...(status && { status }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
      },
      include: INCLUDE,
    });
    res.json(new ApiResponse(200, { activity }, 'CSR activity updated'));
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/csr-activities/:id */
const remove = async (req, res, next) => {
  try {
    const activity = await prisma.cSRActivity.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { participations: true } } },
    });
    if (!activity) throw ApiError.notFound('CSR activity not found');
    if (activity._count.participations > 0) {
      throw ApiError.badRequest(
        `Cannot delete "${activity.title}" — ${activity._count.participations} participation(s) exist. Remove them first.`
      );
    }
    await prisma.cSRActivity.delete({ where: { id: req.params.id } });
    res.json(new ApiResponse(200, null, 'CSR activity deleted'));
  } catch (err) {
    next(err);
  }
};

/** POST /api/csr-activities/:id/join */
const join = async (req, res, next) => {
  try {
    const activity = await prisma.cSRActivity.findUnique({
      where: { id: req.params.id },
    });
    if (!activity) throw ApiError.notFound('CSR activity not found');
    if (activity.status !== 'OPEN') {
      throw ApiError.badRequest('This activity is not open for participation');
    }

    const existing = await prisma.employeeParticipation.findUnique({
      where: {
        activityId_employeeId: {
          activityId: req.params.id,
          employeeId: req.user.id,
        },
      },
    });
    if (existing) throw ApiError.conflict('You have already joined this activity');

    const proof = req.file ? `/uploads/${req.file.filename}` : null;

    const participation = await prisma.employeeParticipation.create({
      data: {
        employeeId: req.user.id,
        activityId: req.params.id,
        approvalStatus: 'PENDING',
        proof,
      },
      include: {
        employee: { select: { id: true, name: true, email: true } },
        activity: { select: { id: true, title: true } },
      },
    });
    res.status(201).json(new ApiResponse(201, { participation }, 'Joined CSR activity'));
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update, remove, join };
