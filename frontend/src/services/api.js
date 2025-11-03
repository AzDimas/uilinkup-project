import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  getUserById: (userId) => api.get(`/users/${userId}`),
  updateProfile: (data) => api.put('/users/profile', data),
  getAllUsers: () => api.get('/users'),
  deleteProfile: () => api.delete('/users/profile'),
};

export const connectionAPI = {
  sendConnectionRequest: (userId) => api.post(`/connections/${userId}/send`),
  checkConnectionStatus: (userId) => api.get(`/connections/status/${userId}`),
  getMyConnections: () => api.get('/connections/my-connections'),
  getPendingRequests: () => api.get('/connections/pending-requests'),
  getSentRequests: () => api.get('/connections/sent-requests'),
  getConnectionStats: () => api.get('/connections/stats'),
  acceptConnection: (connectionId) => api.put(`/connections/${connectionId}/accept`),
  rejectConnection: (connectionId) => api.put(`/connections/${connectionId}/reject`),
  removeConnection: (connectionId) => api.delete(`/connections/${connectionId}/remove`)
};

export default api;