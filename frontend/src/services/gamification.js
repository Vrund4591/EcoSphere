import api from './api';

// ─── Challenges ──────────────────────────────────────────────────────────────
export const challengesAPI = {
  getAll: (params) => api.get('/challenges', { params }),
  getById: (id) => api.get(`/challenges/${id}`),
  create: (d) => api.post('/challenges', d),
  update: (id, d) => api.put(`/challenges/${id}`, d),
  updateStatus: (id, status) => api.put(`/challenges/${id}/status`, { status }),
  join: (id) => api.post(`/challenges/${id}/join`),
  remove: (id) => api.delete(`/challenges/${id}`),
};

// ─── Challenge Participations ─────────────────────────────────────────────────
export const challengeParticipationsAPI = {
  getAll: (params) => api.get('/challenge-participations', { params }),
  getById: (id) => api.get(`/challenge-participations/${id}`),
  update: (id, d) => api.put(`/challenge-participations/${id}`, d),
  approve: (id) => api.put(`/challenge-participations/${id}/approve`),
  reject: (id, reason) => api.put(`/challenge-participations/${id}/reject`, { reason }),
};

// ─── Badges ──────────────────────────────────────────────────────────────────
export const badgesAPI = {
  getAll: (params) => api.get('/badges', { params }),
  getById: (id) => api.get(`/badges/${id}`),
  create: (d) => api.post('/badges', d),
  update: (id, d) => api.put(`/badges/${id}`, d),
  remove: (id) => api.delete(`/badges/${id}`),
};

// ─── Rewards ─────────────────────────────────────────────────────────────────
export const rewardsAPI = {
  getAll: (params) => api.get('/rewards', { params }),
  getById: (id) => api.get(`/rewards/${id}`),
  create: (d) => api.post('/rewards', d),
  update: (id, d) => api.put(`/rewards/${id}`, d),
  remove: (id) => api.delete(`/rewards/${id}`),
  redeem: (id) => api.post(`/rewards/${id}/redeem`),
  getRedemptions: () => api.get('/rewards/redemptions'),
};

// ─── Leaderboard ─────────────────────────────────────────────────────────────
export const leaderboardAPI = {
  get: (params) => api.get('/leaderboard', { params }),
};

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportsAPI = {
  environmental: (params) => api.get('/reports/environmental', { params }),
  social: (params) => api.get('/reports/social', { params }),
  governance: (params) => api.get('/reports/governance', { params }),
  summary: (params) => api.get('/reports/summary', { params }),
  custom: (params) => api.get('/reports/custom', { params }),
};
