const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, paginated } = require('../utils/helpers');

const LIST_INCLUDE = {
  department: { select: { id: true, name: true } },
  _count: { select: { issues: true } },
};

const DETAIL_INCLUDE = {
  department: { select: { id: true, name: true } },
  issues: true,
};

/** GET /api/audits */
const list = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { auditor: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const { page: p, limit: l, skip } = getPagination(page, limit);
    const [audits, total] = await Promise.all([
      prisma.audit.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: LIST_INCLUDE,
      }),
      prisma.audit.count({ where }),
    ]);
    res.json(new ApiResponse(200, paginated(audits, total, p, l), 'Audits retrieved'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/audits/:id */
const getById = async (req, res, next) => {
  try {
    const audit = await prisma.audit.findUnique({
      where: { id: req.params.id },
      include: DETAIL_INCLUDE,
    });
    if (!audit) throw ApiError.notFound('Audit not found');
    res.json(new ApiResponse(200, { audit }, 'Audit retrieved'));
  } catch (err) {
    next(err);
  }
};

/** POST /api/audits */
const create = async (req, res, next) => {
  try {
    const { title, auditor, date, findings, status, departmentId } = req.body;
    if (!title) throw ApiError.badRequest('Title is required');

    const audit = await prisma.audit.create({
      data: {
        title,
        auditor: auditor || null,
        date: date ? new Date(date) : null,
        findings: findings || null,
        status: status || 'UNDER_REVIEW',
        departmentId: departmentId || null,
      },
      include: LIST_INCLUDE,
    });
    res.status(201).json(new ApiResponse(201, { audit }, 'Audit created'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/audits/:id */
const update = async (req, res, next) => {
  try {
    const { title, auditor, date, findings, status, departmentId } = req.body;
    const audit = await prisma.audit.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(auditor !== undefined && { auditor: auditor || null }),
        ...(date !== undefined && { date: date ? new Date(date) : null }),
        ...(findings !== undefined && { findings: findings || null }),
        ...(status && { status }),
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
      },
      include: LIST_INCLUDE,
    });
    res.json(new ApiResponse(200, { audit }, 'Audit updated'));
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/audits/:id */
const remove = async (req, res, next) => {
  try {
    const audit = await prisma.audit.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { issues: true } } },
    });
    if (!audit) throw ApiError.notFound('Audit not found');
    if (audit._count.issues > 0) {
      throw ApiError.badRequest(
        `Cannot delete "${audit.title}" — ${audit._count.issues} issue(s) linked. Resolve them first.`
      );
    }

    await prisma.audit.delete({ where: { id: req.params.id } });
    res.json(new ApiResponse(200, null, 'Audit deleted'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};
