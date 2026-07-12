const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, paginated } = require('../utils/helpers');

const listInclude = (userId) => ({
  _count: { select: { completions: true } },
  // the current user's own completion status for this training
  completions: { where: { employeeId: userId }, select: { status: true, completedAt: true, score: true } },
});

/** GET /api/trainings */
const list = async (req, res, next) => {
  try {
    const { all } = req.query;
    const include = listInclude(req.user.id);
    const totalEmployees = await prisma.user.count({ where: { isActive: true } });

    if (all === 'true') {
      const trainings = await prisma.training.findMany({ orderBy: { createdAt: 'desc' }, include });
      return res.json(new ApiResponse(200, { trainings, totalEmployees }, 'Trainings retrieved'));
    }
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
    const [trainings, total] = await Promise.all([
      prisma.training.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' }, include }),
      prisma.training.count(),
    ]);
    res.json(new ApiResponse(200, { ...paginated(trainings, total, page, limit), totalEmployees }, 'Trainings retrieved'));
  } catch (err) {
    next(err);
  }
};

/** POST /api/trainings */
const create = async (req, res, next) => {
  try {
    const { title, description, provider, category, durationHours, status } = req.body;
    if (!title) throw ApiError.badRequest('Title is required');
    const training = await prisma.training.create({
      data: {
        title,
        description: description || null,
        provider: provider || null,
        category: category || null,
        durationHours: durationHours ? Number(durationHours) : 0,
        status: status || 'ACTIVE',
      },
    });
    res.status(201).json(new ApiResponse(201, { training }, 'Training created'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/trainings/:id */
const update = async (req, res, next) => {
  try {
    const { title, description, provider, category, durationHours, status } = req.body;
    const training = await prisma.training.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(provider !== undefined && { provider: provider || null }),
        ...(category !== undefined && { category: category || null }),
        ...(durationHours !== undefined && { durationHours: Number(durationHours) }),
        ...(status && { status }),
      },
    });
    res.json(new ApiResponse(200, { training }, 'Training updated'));
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/trainings/:id */
const remove = async (req, res, next) => {
  try {
    const training = await prisma.training.findUnique({ where: { id: req.params.id } });
    if (!training) throw ApiError.notFound('Training not found');
    await prisma.training.delete({ where: { id: req.params.id } });
    res.json(new ApiResponse(200, null, 'Training deleted'));
  } catch (err) {
    next(err);
  }
};

/** POST /api/trainings/:id/complete — the current employee marks it complete */
const complete = async (req, res, next) => {
  try {
    const training = await prisma.training.findUnique({ where: { id: req.params.id } });
    if (!training) throw ApiError.notFound('Training not found');
    const score = req.body.score != null ? Number(req.body.score) : null;
    const completion = await prisma.trainingCompletion.upsert({
      where: { trainingId_employeeId: { trainingId: req.params.id, employeeId: req.user.id } },
      create: {
        trainingId: req.params.id,
        employeeId: req.user.id,
        status: 'COMPLETED',
        completedAt: new Date(),
        score,
      },
      update: { status: 'COMPLETED', completedAt: new Date(), ...(score != null && { score }) },
    });
    res.json(new ApiResponse(200, { completion }, 'Training marked complete'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/trainings/completions — completion records (employees see only their own) */
const completions = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.trainingId) where.trainingId = req.query.trainingId;
    if (req.user.role === 'EMPLOYEE') where.employeeId = req.user.id;
    else if (req.query.employeeId) where.employeeId = req.query.employeeId;

    const items = await prisma.trainingCompletion.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        training: { select: { id: true, title: true, category: true } },
        employee: { select: { id: true, name: true, department: { select: { name: true } } } },
      },
    });
    res.json(new ApiResponse(200, { completions: items }, 'Completions retrieved'));
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, update, remove, complete, completions };
