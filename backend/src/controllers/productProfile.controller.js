const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, paginated } = require('../utils/helpers');

const INCLUDE = {
  emissionFactor: { select: { id: true, name: true, factor: true, unit: true } },
};

/** POST /api/product-profiles */
const createProductProfile = async (req, res, next) => {
  try {
    const { name, category, carbonFootprint, recyclablePct, status, emissionFactorId } = req.body;
    if (!name) {
      throw ApiError.badRequest('Name is required');
    }
    const profile = await prisma.productESGProfile.create({
      data: {
        name,
        category: category || null,
        carbonFootprint: carbonFootprint !== undefined ? Number(carbonFootprint) : 0,
        recyclablePct: recyclablePct !== undefined ? Number(recyclablePct) : 0,
        status: status || 'ACTIVE',
        emissionFactorId: emissionFactorId || null,
      },
      include: INCLUDE,
    });
    res.status(201).json(new ApiResponse(201, { profile }, 'Product ESG profile created'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/product-profiles */
const getProductProfiles = async (req, res, next) => {
  try {
    const { page, limit, search, all, status, emissionFactorId } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }
    if (emissionFactorId) {
      where.emissionFactorId = emissionFactorId;
    }

    if (all === 'true') {
      const profiles = await prisma.productESGProfile.findMany({
        where,
        orderBy: { name: 'asc' },
        include: INCLUDE,
      });
      return res.json(new ApiResponse(200, { profiles }, 'Product ESG profiles retrieved'));
    }

    const { page: p, limit: l, skip } = getPagination(page, limit);
    const [profiles, total] = await Promise.all([
      prisma.productESGProfile.findMany({
        where,
        skip,
        take: l,
        orderBy: { name: 'asc' },
        include: INCLUDE,
      }),
      prisma.productESGProfile.count({ where }),
    ]);

    res.json(new ApiResponse(200, paginated(profiles, total, p, l), 'Product ESG profiles retrieved'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/product-profiles/:id */
const getProductProfileById = async (req, res, next) => {
  try {
    const profile = await prisma.productESGProfile.findUnique({
      where: { id: req.params.id },
      include: INCLUDE,
    });
    if (!profile) throw ApiError.notFound('Product ESG profile not found');
    res.json(new ApiResponse(200, { profile }, 'Product ESG profile retrieved'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/product-profiles/:id */
const updateProductProfile = async (req, res, next) => {
  try {
    const { name, category, carbonFootprint, recyclablePct, status, emissionFactorId } = req.body;
    const profile = await prisma.productESGProfile.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(category !== undefined && { category: category || null }),
        ...(carbonFootprint !== undefined && { carbonFootprint: Number(carbonFootprint) }),
        ...(recyclablePct !== undefined && { recyclablePct: Number(recyclablePct) }),
        ...(status && { status }),
        ...(emissionFactorId !== undefined && { emissionFactorId: emissionFactorId || null }),
      },
      include: INCLUDE,
    });
    res.json(new ApiResponse(200, { profile }, 'Product ESG profile updated'));
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/product-profiles/:id */
const deleteProductProfile = async (req, res, next) => {
  try {
    const profile = await prisma.productESGProfile.findUnique({
      where: { id: req.params.id },
    });
    if (!profile) throw ApiError.notFound('Product ESG profile not found');
    await prisma.productESGProfile.delete({ where: { id: req.params.id } });
    res.json(new ApiResponse(200, null, 'Product ESG profile deleted'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProductProfile,
  getProductProfiles,
  getProductProfileById,
  updateProductProfile,
  deleteProductProfile,
};
