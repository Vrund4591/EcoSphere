const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, paginated } = require('../utils/helpers');
const { notify } = require('../services/notification.service');

const INCLUDE = {
  policy: { select: { id: true, title: true, pillar: true } },
  employee: { select: { id: true, name: true, email: true } },
};

/** GET /api/acknowledgements */
const list = async (req, res, next) => {
  try {
    const { page, limit, status, policyId } = req.query;
    const where = {
      ...(status && { status }),
      ...(policyId && { policyId }),
    };

    const { page: p, limit: l, skip } = getPagination(page, limit);
    const [acknowledgements, total] = await Promise.all([
      prisma.policyAcknowledgement.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: INCLUDE,
      }),
      prisma.policyAcknowledgement.count({ where }),
    ]);
    res.json(
      new ApiResponse(200, paginated(acknowledgements, total, p, l), 'Acknowledgements retrieved')
    );
  } catch (err) {
    next(err);
  }
};

/** PUT /api/acknowledgements/:id/remind */
const remind = async (req, res, next) => {
  try {
    const ack = await prisma.policyAcknowledgement.findUnique({
      where: { id: req.params.id },
      include: { policy: { select: { id: true, title: true } } },
    });
    if (!ack) throw ApiError.notFound('Acknowledgement not found');

    await notify(ack.employeeId, {
      type: 'POLICY_REMINDER',
      title: 'Policy Acknowledgement Required',
      message: 'Please review and acknowledge: "' + ack.policy.title + '"',
      link: '/governance',
    });

    res.json(new ApiResponse(200, null, 'Reminder sent'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  remind,
};
