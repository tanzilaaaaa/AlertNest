import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register = (data) => api.post('/api/auth/register', data);
export const login = (data) => api.post('/api/auth/login', data);
export const getMe = () => api.get('/api/auth/me');

// Incidents
export const getIncidents = () => api.get('/api/incidents');
export const getIncident = (id) => api.get(`/api/incidents/${id}`);
export const createIncident = (data) => api.post('/api/incidents', data);
export const assignIncident = (id, data) => api.put(`/api/incidents/${id}/assign`, data);
export const updateStatus = (id, data) => api.put(`/api/incidents/${id}/status`, data);

// Dashboard
export const getDashboardSummary = () => api.get('/api/dashboard/summary');
export const getDashboardAnalytics = () => api.get('/api/dashboard/analytics');

export default api;
