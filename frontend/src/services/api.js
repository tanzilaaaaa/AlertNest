import axios from 'axios';
import { auth } from '../firebase';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Attach fresh Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const register = (data) => api.post('/api/auth/register', data);
export const login = (data) => api.post('/api/auth/login', data);
export const getMe = () => api.get('/api/auth/me');

export const getIncidents = () => api.get('/api/incidents');
export const getIncident = (id) => api.get(`/api/incidents/${id}`);
export const createIncident = (data) => api.post('/api/incidents', data);
export const assignIncident = (id, data) => api.put(`/api/incidents/${id}/assign`, data);
export const updateStatus = (id, data) => api.put(`/api/incidents/${id}/status`, data);

export const getDashboardSummary = () => api.get('/api/dashboard/summary');
export const getDashboardAnalytics = () => api.get('/api/dashboard/analytics');

export default api;
