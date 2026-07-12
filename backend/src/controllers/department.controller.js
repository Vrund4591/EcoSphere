const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, paginated } = require('../utils/helpers');

const INCLUDE = {
  head: { select: { id: true, name: true, email: true } },
  parentDepartment: { select: { id: true, name: true, code: true } },
  _count: { select: { members: true, environmentalGoals: true, audits: true } },
};

/** POST /api/departments */
const createDepartment = async (req, res, next) => {
  try {
    const { name, code, status, headId, parentDepartmentId } = req.body;
    if (!name || !code) throw ApiError.badRequest('Name and code are required');
    const department = await prisma.department.create({
      data: {
        name,
        code,
        status: status || 'ACTIVE',
        headId: headId || null,
        parentDepartmentId: parentDepartmentId || null,
      },
      include: INCLUDE,
    });
    res.status(201).json(new ApiResponse(201, { department }, 'Department created'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/departments */
const getDepartments = async (req, res, next) => {
  try {
    const { page, limit, search, all } = req.query;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    // `all=true` returns the full list (handy for dropdowns)
    if (all === 'true') {
      const departments = await prisma.department.findMany({
        where,
        orderBy: { name: 'asc' },
        include: INCLUDE,
      });
      return res.json(new ApiResponse(200, { departments }, 'Departments retrieved'));
    }

    const { page: p, limit: l, skip } = getPagination(page, limit);
    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip,
        take: l,
        orderBy: { name: 'asc' },
        include: INCLUDE,
      }),
      prisma.department.count({ where }),
    ]);
    res.json(new ApiResponse(200, paginated(departments, total, p, l), 'Departments retrieved'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/departments/:id */
const getDepartmentById = async (req, res, next) => {
  try {
    const department = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: {
        ...INCLUDE,
        members: { select: { id: true, name: true, email: true, role: true } },
        childDepartments: { select: { id: true, name: true, code: true } },
      },
    });
    if (!department) throw ApiError.notFound('Department not found');
    res.json(new ApiResponse(200, { department }, 'Department retrieved'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/departments/:id */
const updateDepartment = async (req, res, next) => {
  try {
    const { name, code, status, headId, parentDepartmentId } = req.body;
    const department = await prisma.department.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
        ...(status && { status }),
        ...(headId !== undefined && { headId: headId || null }),
        ...(parentDepartmentId !== undefined && {
          parentDepartmentId: parentDepartmentId || null,
        }),
      },
      include: INCLUDE,
    });
    res.json(new ApiResponse(200, { department }, 'Department updated'));
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/departments/:id */
const deleteDepartment = async (req, res, next) => {
  try {
    const dept = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { members: true } } },
    });
    if (!dept) throw ApiError.notFound('Department not found');
    if (dept._count.members > 0) {
      throw ApiError.badRequest(
        `Cannot delete "${dept.name}" — ${dept._count.members} member(s) assigned. Reassign them first.`
      );
    }
    await prisma.department.delete({ where: { id: req.params.id } });
    res.json(new ApiResponse(200, null, 'Department deleted'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
