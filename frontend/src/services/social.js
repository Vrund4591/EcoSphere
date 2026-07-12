import api from './api';

export const csrActivitiesAPI = {
  getAll: (params) => api.get('/csr-activities', { params }),
  getById: (id) => api.get(`/csr-activities/${id}`),
  create: (d) => api.post('/csr-activities', d),
  update: (id, d) => api.put(`/csr-activities/${id}`, d),
  remove: (id) => api.delete(`/csr-activities/${id}`),
  join: (id, formData) => api.post(`/csr-activities/${id}/join`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const participationsAPI = {
  getAll: (params) => api.get('/participations', { params }),
  approve: (id) => api.put(`/participations/${id}/approve`),
  reject: (id) => api.put(`/participations/${id}/reject`),
};

export const diversityAPI = {
  get: () => api.get('/social/diversity'),
};

export const trainingsAPI = {
  getAll: (params) => api.get('/trainings', { params }),
  create: (d) => api.post('/trainings', d),
  update: (id, d) => api.put(`/trainings/${id}`, d),
  remove: (id) => api.delete(`/trainings/${id}`),
  complete: (id, d) => api.post(`/trainings/${id}/complete`, d || {}),
};
