const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, paginated } = require('../utils/helpers');

/** POST /api/emission-factors */
const createEmissionFactor = async (req, res, next) => {
  try {
    const { name, source, unit, factor, reference, status } = req.body;
    if (!name || !unit || factor === undefined) {
      throw ApiError.badRequest('Name, unit, and factor are required');
    }
    const emissionFactor = await prisma.emissionFactor.create({
      data: {
        name,
        source: source || 'MANUAL',
        unit,
        factor: Number(factor),
        reference: reference || null,
        status: status || 'ACTIVE',
      },
    });
    res.status(201).json(new ApiResponse(201, { emissionFactor }, 'Emission factor created'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/emission-factors */
const getEmissionFactors = async (req, res, next) => {
  try {
    const { page, limit, search, all, source, status } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (source) {
      where.source = source;
    }
    if (status) {
      where.status = status;
    }

    if (all === 'true') {
      const emissionFactors = await prisma.emissionFactor.findMany({
        where,
        orderBy: { name: 'asc' },
      });
      return res.json(new ApiResponse(200, { emissionFactors }, 'Emission factors retrieved'));
    }

    const { page: p, limit: l, skip } = getPagination(page, limit);
    const [emissionFactors, total] = await Promise.all([
      prisma.emissionFactor.findMany({
        where,
        skip,
        take: l,
        orderBy: { name: 'asc' },
      }),
      prisma.emissionFactor.count({ where }),
    ]);

    res.json(new ApiResponse(200, paginated(emissionFactors, total, p, l), 'Emission factors retrieved'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/emission-factors/:id */
const getEmissionFactorById = async (req, res, next) => {
  try {
    const emissionFactor = await prisma.emissionFactor.findUnique({
      where: { id: req.params.id },
    });
    if (!emissionFactor) throw ApiError.notFound('Emission factor not found');
    res.json(new ApiResponse(200, { emissionFactor }, 'Emission factor retrieved'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/emission-factors/:id */
const updateEmissionFactor = async (req, res, next) => {
  try {
    const { name, source, unit, factor, reference, status } = req.body;
    const emissionFactor = await prisma.emissionFactor.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(source && { source }),
        ...(unit && { unit }),
        ...(factor !== undefined && { factor: Number(factor) }),
        ...(reference !== undefined && { reference: reference || null }),
        ...(status && { status }),
      },
    });
    res.json(new ApiResponse(200, { emissionFactor }, 'Emission factor updated'));
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/emission-factors/:id */
const deleteEmissionFactor = async (req, res, next) => {
  try {
    const factor = await prisma.emissionFactor.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { carbonTransactions: true, productProfiles: true } },
      },
    });
    if (!factor) throw ApiError.notFound('Emission factor not found');
    if (factor._count.carbonTransactions > 0 || factor._count.productProfiles > 0) {
      throw ApiError.badRequest(
        `Cannot delete "${factor.name}" — it is in use by ${factor._count.carbonTransactions} transactions or ${factor._count.productProfiles} product profiles.`
      );
    }
    await prisma.emissionFactor.delete({ where: { id: req.params.id } });
    res.json(new ApiResponse(200, null, 'Emission factor deleted'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createEmissionFactor,
  getEmissionFactors,
  getEmissionFactorById,
  updateEmissionFactor,
  deleteEmissionFactor,
};
