const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const TYPES = ['CSR_ACTIVITY', 'CHALLENGE'];

/** GET /api/categories?type=CSR_ACTIVITY|CHALLENGE */
const getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;
    const where = type ? { type } : {};
    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { _count: { select: { csrActivities: true, challenges: true } } },
    });
    res.json(new ApiResponse(200, { categories }, 'Categories retrieved'));
  } catch (err) {
    next(err);
  }
};

/** POST /api/categories */
const createCategory = async (req, res, next) => {
  try {
    const { name, type, status } = req.body;
    if (!name || !type) throw ApiError.badRequest('Name and type are required');
    if (!TYPES.includes(type)) throw ApiError.badRequest('Type must be CSR_ACTIVITY or CHALLENGE');
    const category = await prisma.category.create({
      data: { name, type, status: status || 'ACTIVE' },
    });
    res.status(201).json(new ApiResponse(201, { category }, 'Category created'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/categories/:id */
const updateCategory = async (req, res, next) => {
  try {
    const { name, type, status } = req.body;
    if (type && !TYPES.includes(type)) throw ApiError.badRequest('Invalid type');
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(type && { type }), ...(status && { status }) },
    });
    res.json(new ApiResponse(200, { category }, 'Category updated'));
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/categories/:id */
const deleteCategory = async (req, res, next) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json(new ApiResponse(200, null, 'Category deleted'));
  } catch (err) {
    next(err);
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
