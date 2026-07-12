module.exports = {
  // User roles
  ROLES: {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    EMPLOYEE: 'EMPLOYEE',
  },

  // Shared status enums (mirror Prisma enums so controllers avoid magic strings)
  APPROVAL_STATUS: { PENDING: 'PENDING', APPROVED: 'APPROVED', REJECTED: 'REJECTED' },
  CHALLENGE_STATUS: {
    DRAFT: 'DRAFT',
    ACTIVE: 'ACTIVE',
    UNDER_REVIEW: 'UNDER_REVIEW',
    COMPLETED: 'COMPLETED',
    ARCHIVED: 'ARCHIVED',
  },
  ISSUE_STATUS: { OPEN: 'OPEN', IN_PROGRESS: 'IN_PROGRESS', RESOLVED: 'RESOLVED' },
  CARBON_SOURCE: {
    PURCHASE: 'PURCHASE',
    MANUFACTURING: 'MANUFACTURING',
    EXPENSE: 'EXPENSE',
    FLEET: 'FLEET',
    MANUAL: 'MANUAL',
  },
  ESG_PILLAR: { ENVIRONMENTAL: 'ENVIRONMENTAL', SOCIAL: 'SOCIAL', GOVERNANCE: 'GOVERNANCE' },

  // Notification types
  NOTIF_TYPES: {
    COMPLIANCE_ISSUE: 'COMPLIANCE_ISSUE',
    CSR_APPROVAL: 'CSR_APPROVAL',
    CHALLENGE_APPROVAL: 'CHALLENGE_APPROVAL',
    BADGE_UNLOCK: 'BADGE_UNLOCK',
    POLICY_REMINDER: 'POLICY_REMINDER',
    REWARD_REDEEMED: 'REWARD_REDEEMED',
  },

  // Default ESG weighting (configurable per org via Setting)
  DEFAULT_WEIGHTS: { environmental: 40, social: 30, governance: 30 },

  // JWT
  JWT: { EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d' },

  // Password rules (relaxed for demo speed)
  PASSWORD: { MIN_LENGTH: 6 },

  // Pagination
  PAGINATION: { DEFAULT_PAGE: 1, DEFAULT_LIMIT: 20, MAX_LIMIT: 100 },
};
