const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');

/**
 * Verify JWT and attach the full user (with department) to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Access token is required');
    }
    const token = authHeader.split(' ')[1];
    if (!token) throw ApiError.unauthorized('Access token is required');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { department: true },
    });

    if (!user) throw ApiError.unauthorized('User not found');
    if (!user.isActive) throw ApiError.unauthorized('User account is deactivated');

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(ApiError.unauthorized('Invalid access token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Access token has expired'));
    }
    next(error);
  }
};

/** Attaches user if a valid token is present; never fails */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
    const token = authHeader.split(' ')[1];
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { department: true },
    });
    if (user && user.isActive) req.user = user;
    next();
  } catch {
    next();
  }
};

module.exports = { authenticate, optionalAuth };
