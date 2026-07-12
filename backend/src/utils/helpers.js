const { PASSWORD, PAGINATION } = require('../config/constants');

/**
 * Validate password strength (relaxed for hackathon demo):
 * min length + at least one letter and one number.
 */
const validatePassword = (password = '') => {
  const errors = [];
  if (password.length < PASSWORD.MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD.MIN_LENGTH} characters`);
  }
  if (!/[a-zA-Z]/.test(password)) errors.push('Password must contain a letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain a number');
  return { isValid: errors.length === 0, errors };
};

/** Normalize page/limit query params into { page, limit, skip } */
const getPagination = (page, limit) => {
  const pageNum = Math.max(1, parseInt(page) || PAGINATION.DEFAULT_PAGE);
  const limitNum = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(limit) || PAGINATION.DEFAULT_LIMIT)
  );
  return { page: pageNum, limit: limitNum, skip: (pageNum - 1) * limitNum };
};

/** Uniform paginated payload */
const paginated = (data, total, page, limit) => ({
  data,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  },
});

/** True if a due date has passed */
const isOverdue = (dueDate) => !!dueDate && new Date(dueDate) < new Date();

/** Escape LIKE wildcards in a search query */
const sanitizeSearchQuery = (q) => (q ? q.trim().replace(/[%_]/g, '\\$&') : '');

module.exports = {
  validatePassword,
  getPagination,
  paginated,
  isOverdue,
  sanitizeSearchQuery,
};
