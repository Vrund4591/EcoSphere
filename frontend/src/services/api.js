import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// --- Platform (Lead) ---
export const authAPI = {
  login: (d) => api.post('/auth/login', d),
  signup: (d) => api.post('/auth/signup', d),
  me: () => api.get('/auth/me'),
  updateProfile: (d) => api.put('/auth/profile', d),
  changePassword: (d) => api.put('/auth/change-password', d),
};
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  create: (d) => api.post('/users', d),
  update: (id, d) => api.put(`/users/${id}`, d),
  remove: (id) => api.delete(`/users/${id}`),
};
export const departmentsAPI = {
  getAll: (params) => api.get('/departments', { params }),
  create: (d) => api.post('/departments', d),
  update: (id, d) => api.put(`/departments/${id}`, d),
  remove: (id) => api.delete(`/departments/${id}`),
};
export const categoriesAPI = {
  getAll: (params) => api.get('/categories', { params }),
  create: (d) => api.post('/categories', d),
  update: (id, d) => api.put(`/categories/${id}`, d),
  remove: (id) => api.delete(`/categories/${id}`),
};
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (d) => api.put('/settings', d),
};
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAll: () => api.put('/notifications/read-all'),
};
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
  recompute: () => api.post('/dashboard/recompute'),
};

// ============================================================
// TEAMMATES: add your module API objects below (append-only).
//   e.g. export const emissionFactorsAPI = { getAll: (p) => api.get('/emission-factors', { params: p }), ... }
// ============================================================
