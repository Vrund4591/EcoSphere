const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { JWT, ROLES } = require('../config/constants');

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: JWT.EXPIRES_IN });

const strip = (u) => {
  const { password, ...rest } = u;
  return rest;
};

/** POST /api/auth/signup — public self-signup, always creates an EMPLOYEE */
const signup = async (req, res, next) => {
  try {
    const { name, email, password, departmentId, gender } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw ApiError.conflict('Email is already registered');

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: ROLES.EMPLOYEE,
        departmentId: departmentId || null,
        gender: gender || null,
      },
      include: { department: true },
    });

    const token = signToken(user.id);
    res
      .status(201)
      .json(new ApiResponse(201, { user: strip(user), token }, 'Signup successful'));
  } catch (err) {
    next(err);
  }
};

/** POST /api/auth/login */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { department: true },
    });
    if (!user) throw ApiError.unauthorized('Invalid email or password');
    if (!user.isActive) throw ApiError.unauthorized('Your account has been deactivated');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw ApiError.unauthorized('Invalid email or password');

    const token = signToken(user.id);
    res.json(new ApiResponse(200, { user: strip(user), token }, 'Login successful'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/auth/me */
const getMe = async (req, res, next) => {
  try {
    res.json(new ApiResponse(200, { user: strip(req.user) }, 'Profile retrieved'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/auth/profile */
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar, gender, departmentId } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(avatar !== undefined && { avatar }),
        ...(gender && { gender }),
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
      },
      include: { department: true },
    });
    res.json(new ApiResponse(200, { user: strip(user) }, 'Profile updated'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/auth/change-password */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const ok = await bcrypt.compare(currentPassword, req.user.password);
    if (!ok) throw ApiError.badRequest('Current password is incorrect');
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json(new ApiResponse(200, null, 'Password changed'));
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, getMe, updateProfile, changePassword };
