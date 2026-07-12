const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, paginated } = require('../utils/helpers');
const { notify, notifyMany, notifyAdmins } = require('../services/notification.service');

const LIST_INCLUDE = {
  _count: { select: { acknowledgements: true } },
};

const DETAIL_INCLUDE = {
  acknowledgements: {
    include: {
      employee: { select: { id: true, name: true, email: true } },
    },
  },
};

/** GET /api/policies */
const list = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const where = search
      ? { title: { contains: search, mode: 'insensitive' } }
      : {};

    const { page: p, limit: l, skip } = getPagination(page, limit);
    const [policies, total] = await Promise.all([
      prisma.eSGPolicy.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: LIST_INCLUDE,
      }),
      prisma.eSGPolicy.count({ where }),
    ]);
    res.json(new ApiResponse(200, paginated(policies, total, p, l), 'Policies retrieved'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/policies/:id */
const getById = async (req, res, next) => {
  try {
    const policy = await prisma.eSGPolicy.findUnique({
      where: { id: req.params.id },
      include: DETAIL_INCLUDE,
    });
    if (!policy) throw ApiError.notFound('Policy not found');
    res.json(new ApiResponse(200, { policy }, 'Policy retrieved'));
  } catch (err) {
    next(err);
  }
};

/** POST /api/policies */
const create = async (req, res, next) => {
  try {
    const { title, description, pillar, version, effectiveDate, status } = req.body;
    if (!title) throw ApiError.badRequest('Title is required');

    const policy = await prisma.eSGPolicy.create({
      data: {
        title,
        description: description || null,
        pillar: pillar || 'GOVERNANCE',
        version: version || '1.0',
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        status: status || 'ACTIVE',
      },
      include: LIST_INCLUDE,
    });
    res.status(201).json(new ApiResponse(201, { policy }, 'Policy created'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/policies/:id */
const update = async (req, res, next) => {
  try {
    const { title, description, pillar, version, effectiveDate, status } = req.body;
    const policy = await prisma.eSGPolicy.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(pillar && { pillar }),
        ...(version && { version }),
        ...(effectiveDate !== undefined && {
          effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        }),
        ...(status && { status }),
      },
      include: LIST_INCLUDE,
    });
    res.json(new ApiResponse(200, { policy }, 'Policy updated'));
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/policies/:id */
const remove = async (req, res, next) => {
  try {
    const policy = await prisma.eSGPolicy.findUnique({
      where: { id: req.params.id },
    });
    if (!policy) throw ApiError.notFound('Policy not found');

    await prisma.eSGPolicy.delete({ where: { id: req.params.id } });
    res.json(new ApiResponse(200, null, 'Policy deleted'));
  } catch (err) {
    next(err);
  }
};

/** POST /api/policies/:id/acknowledge */
const acknowledge = async (req, res, next) => {
  try {
    const policy = await prisma.eSGPolicy.findUnique({
      where: { id: req.params.id },
    });
    if (!policy) throw ApiError.notFound('Policy not found');

    const acknowledgement = await prisma.policyAcknowledgement.upsert({
      where: {
        policyId_employeeId: {
          policyId: req.params.id,
          employeeId: req.user.id,
        },
      },
      update: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
      },
      create: {
        policyId: req.params.id,
        employeeId: req.user.id,
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
      },
    });
    res.json(new ApiResponse(200, { acknowledgement }, 'Policy acknowledged'));
  } catch (err) {
    next(err);
  }
};

/** POST /api/policies/:id/remind */
const remind = async (req, res, next) => {
  try {
    const policy = await prisma.eSGPolicy.findUnique({
      where: { id: req.params.id },
    });
    if (!policy) throw ApiError.notFound('Policy not found');

    // Find existing PENDING acknowledgements
    let pending = await prisma.policyAcknowledgement.findMany({
      where: { policyId: req.params.id, status: 'PENDING' },
      select: { employeeId: true },
    });

    // If none pending, find all users who haven't acknowledged and create PENDING records
    if (pending.length === 0) {
      const acknowledged = await prisma.policyAcknowledgement.findMany({
        where: { policyId: req.params.id },
        select: { employeeId: true },
      });
      const acknowledgedIds = acknowledged.map((a) => a.employeeId);

      const unacknowledged = await prisma.user.findMany({
        where: { isActive: true, id: { notIn: acknowledgedIds } },
        select: { id: true },
      });

      if (unacknowledged.length > 0) {
        await prisma.policyAcknowledgement.createMany({
          data: unacknowledged.map((u) => ({
            policyId: req.params.id,
            employeeId: u.id,
            status: 'PENDING',
          })),
        });
        pending = unacknowledged.map((u) => ({ employeeId: u.id }));
      }
    }

    const pendingEmployeeIds = pending.map((p) => p.employeeId);

    if (pendingEmployeeIds.length > 0) {
      await notifyMany(pendingEmployeeIds, {
        type: 'POLICY_REMINDER',
        title: 'Policy Acknowledgement Required',
        message: 'Please review and acknowledge: "' + policy.title + '"',
        link: '/governance',
      });
    }

    res.json(
      new ApiResponse(200, { notifiedCount: pendingEmployeeIds.length }, 'Reminders sent')
    );
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
  acknowledge,
  remind,
};
