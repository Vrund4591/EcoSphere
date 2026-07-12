const { ROLES } = require('../config/constants');
const ApiError = require('../utils/ApiError');

/**
 * Role-based authorization middleware.
 * Usage: router.post('/', authenticate, authorize(ROLES.ADMIN, ROLES.MANAGER), handler)
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized('Authentication required'));
  if (!allowedRoles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action'));
  }
  next();
};

const isAdmin = authorize(ROLES.ADMIN);
const isManager = authorize(ROLES.MANAGER);
const isAdminOrManager = authorize(ROLES.ADMIN, ROLES.MANAGER);

module.exports = { authorize, isAdmin, isManager, isAdminOrManager };
