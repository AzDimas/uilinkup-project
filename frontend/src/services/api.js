// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Inject JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ===== AUTH ===== */
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

/* ===== USERS ===== */
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  getUserById: (userId) => api.get(`/users/${userId}`),
  updateProfile: (data) => api.put('/users/profile', data),
  getAllUsers: () => api.get('/users'),
  deleteProfile: () => api.delete('/users/profile'),
};

/* ===== CONNECTIONS ===== */
export const connectionAPI = {
  sendConnectionRequest: (userId) => api.post(`/connections/${userId}/send`),
  checkConnectionStatus: (userId) => api.get(`/connections/status/${userId}`),
  getMyConnections: () => api.get('/connections/my-connections'),
  getPendingRequests: () => api.get('/connections/pending-requests'),
  getSentRequests: () => api.get('/connections/sent-requests'),
  getConnectionStats: () => api.get('/connections/stats'),
  acceptConnection: (connectionId) => api.put(`/connections/${connectionId}/accept`),
  rejectConnection: (connectionId) => api.put(`/connections/${connectionId}/reject`),
  removeConnection: (connectionId) => api.delete(`/connections/${connectionId}/remove`),
};

/* ===== MESSAGES ===== */
export const messageAPI = {
  getThreads: () => api.get('/messages/threads'),
  getConversation: (userId, params = {}) => api.get(`/messages/${userId}`, { params }),
  sendMessage: (userId, payload) => api.post(`/messages/${userId}`, payload),
  markAsRead: (userId) => api.put(`/messages/${userId}/read`),
};

/* ===== JOBS & APPLICATIONS ===== */
export const jobsAPI = {
  list: (params = {}) => api.get('/jobs', { params }),
  detail: (jobId) => api.get(`/jobs/${jobId}`),
  create: (payload) => api.post('/jobs', payload),
  deactivate: (jobId) => api.delete(`/jobs/${jobId}`),
  myPosted: () => api.get('/jobs/me/posted'),
  myApplied: () => api.get('/jobs/me/applied'),
  apply: (jobId, payload) => api.post(`/jobs/${jobId}/apply`, payload),
  getApplicants: (jobId) => api.get(`/jobs/${jobId}/applications`),
};

// PATCH /jobs/:jobId/applications/:applicationId  { status, note? }
export const applicationsAPI = {
  // Kompatibel dgn pemakaian lama: updateStatus(jobId, applicationId, status)
  updateStatus: (jobId, applicationId, status) =>
    api.patch(`/jobs/${jobId}/applications/${applicationId}`, { status }),

  // Versi dengan pesan tambahan ke kandidat: updateStatusWithNote(jobId, applicationId, { status, note })
  updateStatusWithNote: (jobId, applicationId, { status, note }) =>
    api.patch(`/jobs/${jobId}/applications/${applicationId}`, { status, note }),
};

export default api;
