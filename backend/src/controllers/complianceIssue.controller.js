const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, paginated, isOverdue } = require('../utils/helpers');
const { notify, notifyAdmins } = require('../services/notification.service');

const INCLUDE = {
  owner: { select: { id: true, name: true, email: true } },
  audit: { select: { id: true, title: true } },
};

/** Attach the computed isOverdue flag */
const withOverdue = (item) => ({
  ...item,
  isOverdue: isOverdue(item.dueDate) && item.status !== 'RESOLVED',
});

/** GET /api/compliance-issues */
const list = async (req, res, next) => {
  try {
    const { page, limit, status, severity } = req.query;
    const where = {
      ...(status && { status }),
      ...(severity && { severity }),
    };

    const { page: p, limit: l, skip } = getPagination(page, limit);
    const [items, total] = await Promise.all([
      prisma.complianceIssue.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: INCLUDE,
      }),
      prisma.complianceIssue.count({ where }),
    ]);

    const issues = items.map(withOverdue);
    res.json(new ApiResponse(200, paginated(issues, total, p, l), 'Compliance issues retrieved'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/compliance-issues/:id */
const getById = async (req, res, next) => {
  try {
    const item = await prisma.complianceIssue.findUnique({
      where: { id: req.params.id },
      include: INCLUDE,
    });
    if (!item) throw ApiError.notFound('Compliance issue not found');

    const issue = withOverdue(item);
    res.json(new ApiResponse(200, { issue }, 'Compliance issue retrieved'));
  } catch (err) {
    next(err);
  }
};

/** POST /api/compliance-issues */
const create = async (req, res, next) => {
  try {
    const { title, description, severity, dueDate, status, auditId, ownerId } = req.body;
    if (!title) throw ApiError.badRequest('Title is required');
    if (!ownerId) throw ApiError.badRequest('Owner is required');
    if (!dueDate) throw ApiError.badRequest('Due date is required');

    const issue = await prisma.complianceIssue.create({
      data: {
        title,
        description: description || null,
        severity: severity || 'MEDIUM',
        dueDate: new Date(dueDate),
        status: status || 'OPEN',
        auditId: auditId || null,
        ownerId,
      },
      include: INCLUDE,
    });

    // Notify the assigned owner
    await notify(ownerId, {
      type: 'COMPLIANCE_ISSUE',
      title: 'New Compliance Issue Assigned',
      message: 'You have been assigned: "' + title + '"',
      link: '/governance',
    });

    // Notify all admins
    await notifyAdmins({
      type: 'COMPLIANCE_ISSUE',
      title: 'New Compliance Issue',
      message: '"' + title + '" (severity: ' + (severity || 'MEDIUM') + ') has been raised',
      link: '/governance',
    });

    res.status(201).json(new ApiResponse(201, { issue: withOverdue(issue) }, 'Compliance issue created'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/compliance-issues/:id */
const update = async (req, res, next) => {
  try {
    const { title, description, severity, dueDate, status, auditId, ownerId } = req.body;
    const item = await prisma.complianceIssue.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(severity && { severity }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : undefined }),
        ...(status && { status }),
        ...(auditId !== undefined && { auditId: auditId || null }),
        ...(ownerId && { ownerId }),
      },
      include: INCLUDE,
    });
    res.json(new ApiResponse(200, { issue: withOverdue(item) }, 'Compliance issue updated'));
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/compliance-issues/:id */
const remove = async (req, res, next) => {
  try {
    const issue = await prisma.complianceIssue.findUnique({
      where: { id: req.params.id },
    });
    if (!issue) throw ApiError.notFound('Compliance issue not found');

    await prisma.complianceIssue.delete({ where: { id: req.params.id } });
    res.json(new ApiResponse(200, null, 'Compliance issue deleted'));
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
