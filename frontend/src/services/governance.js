import api from './api';

export const policiesAPI = {
  getAll: (params) => api.get('/policies', { params }),
  getById: (id) => api.get(`/policies/${id}`),
  create: (d) => api.post('/policies', d),
  update: (id, d) => api.put(`/policies/${id}`, d),
  remove: (id) => api.delete(`/policies/${id}`),
  acknowledge: (id) => api.post(`/policies/${id}/acknowledge`),
  remind: (id) => api.post(`/policies/${id}/remind`),
};

export const acknowledgementsAPI = {
  getAll: (params) => api.get('/acknowledgements', { params }),
  remind: (id) => api.put(`/acknowledgements/${id}/remind`),
};

export const auditsAPI = {
  getAll: (params) => api.get('/audits', { params }),
  create: (d) => api.post('/audits', d),
  update: (id, d) => api.put(`/audits/${id}`, d),
  remove: (id) => api.delete(`/audits/${id}`),
};

export const complianceIssuesAPI = {
  getAll: (params) => api.get('/compliance-issues', { params }),
  create: (d) => api.post('/compliance-issues', d),
  update: (id, d) => api.put(`/compliance-issues/${id}`, d),
  remove: (id) => api.delete(`/compliance-issues/${id}`),
};
