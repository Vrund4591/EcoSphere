const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, paginated } = require('../utils/helpers');

const INCLUDE = {
  department: { select: { id: true, name: true, code: true } },
};

/** POST /api/environmental-goals */
const createEnvironmentalGoal = async (req, res, next) => {
  try {
    const { name, targetCo2, currentCo2, deadline, status, departmentId } = req.body;
    if (!name || targetCo2 === undefined) {
      throw ApiError.badRequest('Name and targetCo2 are required');
    }
    const goal = await prisma.environmentalGoal.create({
      data: {
        name,
        targetCo2: Number(targetCo2),
        currentCo2: currentCo2 !== undefined ? Number(currentCo2) : 0,
        deadline: deadline ? new Date(deadline) : null,
        status: status || 'ACTIVE',
        departmentId: departmentId || null,
      },
      include: INCLUDE,
    });
    res.status(201).json(new ApiResponse(201, { goal }, 'Environmental goal created'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/environmental-goals */
const getEnvironmentalGoals = async (req, res, next) => {
  try {
    const { page, limit, search, all, departmentId, status } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { department: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (departmentId) {
      where.departmentId = departmentId;
    }
    if (status) {
      where.status = status;
    }

    if (all === 'true') {
      const goals = await prisma.environmentalGoal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: INCLUDE,
      });
      return res.json(new ApiResponse(200, { goals }, 'Environmental goals retrieved'));
    }

    const { page: p, limit: l, skip } = getPagination(page, limit);
    const [goals, total] = await Promise.all([
      prisma.environmentalGoal.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: INCLUDE,
      }),
      prisma.environmentalGoal.count({ where }),
    ]);

    res.json(new ApiResponse(200, paginated(goals, total, p, l), 'Environmental goals retrieved'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/environmental-goals/:id */
const getEnvironmentalGoalById = async (req, res, next) => {
  try {
    const goal = await prisma.environmentalGoal.findUnique({
      where: { id: req.params.id },
      include: INCLUDE,
    });
    if (!goal) throw ApiError.notFound('Environmental goal not found');
    res.json(new ApiResponse(200, { goal }, 'Environmental goal retrieved'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/environmental-goals/:id */
const updateEnvironmentalGoal = async (req, res, next) => {
  try {
    const { name, targetCo2, currentCo2, deadline, status, departmentId } = req.body;
    const goal = await prisma.environmentalGoal.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(targetCo2 !== undefined && { targetCo2: Number(targetCo2) }),
        ...(currentCo2 !== undefined && { currentCo2: Number(currentCo2) }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(status && { status }),
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
      },
      include: INCLUDE,
    });
    res.json(new ApiResponse(200, { goal }, 'Environmental goal updated'));
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/environmental-goals/:id */
const deleteEnvironmentalGoal = async (req, res, next) => {
  try {
    const goal = await prisma.environmentalGoal.findUnique({
      where: { id: req.params.id },
    });
    if (!goal) throw ApiError.notFound('Environmental goal not found');
    await prisma.environmentalGoal.delete({ where: { id: req.params.id } });
    res.json(new ApiResponse(200, null, 'Environmental goal deleted'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createEnvironmentalGoal,
  getEnvironmentalGoals,
  getEnvironmentalGoalById,
  updateEnvironmentalGoal,
  deleteEnvironmentalGoal,
};
