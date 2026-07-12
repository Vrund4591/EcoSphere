import api from './api';

export const emissionFactorsAPI = {
  getAll: (params) => api.get('/emission-factors', { params }),
  create: (d) => api.post('/emission-factors', d),
  update: (id, d) => api.put(`/emission-factors/${id}`, d),
  remove: (id) => api.delete(`/emission-factors/${id}`),
};

export const carbonTransactionsAPI = {
  getAll: (params) => api.get('/carbon-transactions', { params }),
  create: (d) => api.post('/carbon-transactions', d),
  update: (id, d) => api.put(`/carbon-transactions/${id}`, d),
  remove: (id) => api.delete(`/carbon-transactions/${id}`),
  generate: () => api.post('/carbon-transactions/generate'),
};

export const environmentalGoalsAPI = {
  getAll: (params) => api.get('/environmental-goals', { params }),
  create: (d) => api.post('/environmental-goals', d),
  update: (id, d) => api.put(`/environmental-goals/${id}`, d),
  remove: (id) => api.delete(`/environmental-goals/${id}`),
};

export const productProfilesAPI = {
  getAll: (params) => api.get('/product-profiles', { params }),
  create: (d) => api.post('/product-profiles', d),
  update: (id, d) => api.put(`/product-profiles/${id}`, d),
  remove: (id) => api.delete(`/product-profiles/${id}`),
};
