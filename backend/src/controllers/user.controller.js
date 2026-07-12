const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, paginated } = require('../utils/helpers');

const SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  gender: true,
  xp: true,
  points: true,
  isActive: true,
  createdAt: true,
  departmentId: true,
  department: { select: { id: true, name: true, code: true } },
};

/** GET /api/users — any authenticated user (used for dropdowns + admin table) */
const getUsers = async (req, res, next) => {
  try {
    const { page, limit, search, role, departmentId } = req.query;
    const { page: p, limit: l, skip } = getPagination(page, limit);

    const where = {
      ...(role && { role }),
      ...(departmentId && { departmentId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: SAFE_SELECT,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json(new ApiResponse(200, paginated(users, total, p, l), 'Users retrieved'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/users/:id */
const getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: SAFE_SELECT,
    });
    if (!user) throw ApiError.notFound('User not found');
    res.json(new ApiResponse(200, { user }, 'User retrieved'));
  } catch (err) {
    next(err);
  }
};

/** POST /api/users — admin creates a user with a chosen role + department */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, departmentId, gender } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw ApiError.conflict('Email is already registered');

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: role || 'EMPLOYEE',
        departmentId: departmentId || null,
        gender: gender || null,
      },
      select: SAFE_SELECT,
    });
    res.status(201).json(new ApiResponse(201, { user }, 'User created'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/users/:id — admin updates role / department / status / name */
const updateUser = async (req, res, next) => {
  try {
    const { name, role, departmentId, gender, isActive } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
        ...(gender && { gender }),
        ...(isActive !== undefined && { isActive }),
      },
      select: SAFE_SELECT,
    });
    res.json(new ApiResponse(200, { user }, 'User updated'));
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/users/:id — admin */
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      throw ApiError.badRequest('You cannot delete your own account');
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json(new ApiResponse(200, null, 'User deleted'));
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };
