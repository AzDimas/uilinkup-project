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
  checkConnectionStatus: (userId) =>
    api.get(`/connections/status/${userId}`),
  getMyConnections: () => api.get('/connections/my-connections'),
  getPendingRequests: () => api.get('/connections/pending-requests'),
  getSentRequests: () => api.get('/connections/sent-requests'),

  // (opsional) stats global koneksi sendiri kalau backend-mu punya /connections/stats
  getConnectionStats: () => api.get('/connections/stats'),

  // 🔴 DULU: api.get(`/connections/stats/${userId}`)
  // 🔵 SEKARANG: pakai endpoint baru di userRoutes → GET /users/:id/stats
  getStatsByUserId: (userId) => api.get(`/users/${userId}/stats`),

  acceptConnection: (connectionId) =>
    api.put(`/connections/${connectionId}/accept`),
  rejectConnection: (connectionId) =>
    api.put(`/connections/${connectionId}/reject`),
  removeConnection: (connectionId) =>
    api.delete(`/connections/${connectionId}/remove`),
};

/* ===== MESSAGES ===== */
export const messageAPI = {
  getThreads: () => api.get('/messages/threads'),
  getConversation: (userId, params = {}) =>
    api.get(`/messages/${userId}`, { params }),
  sendMessage: (userId, payload) =>
    api.post(`/messages/${userId}`, payload),
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

  // Versi dengan pesan tambahan ke kandidat: { status, note }
  updateStatusWithNote: (jobId, applicationId, { status, note }) =>
    api.patch(`/jobs/${jobId}/applications/${applicationId}`, {
      status,
      note,
    }),
};

/* ===== EVENTS ===== */
export const eventsAPI = {
  list: (params = {}) => api.get('/events', { params }),
  detail: (eventId) => api.get(`/events/${eventId}`),

  create: (payload) => api.post('/events', payload),
  update: (eventId, payload) => api.put(`/events/${eventId}`, payload),
  cancel: (eventId) => api.delete(`/events/${eventId}`),

  register: (eventId) => api.post(`/events/${eventId}/register`),
  unregister: (eventId) => api.delete(`/events/${eventId}/register`),

  myHosting: () => api.get('/events/me/hosting/list'),
  myRegistered: () => api.get('/events/me/registered/list'),

  registrants: (eventId) =>
    api.get(`/events/${eventId}/registrants`), // organizer only
};

/* ===== GROUPS & FORUM (NEW) ===== */
export const groupsAPI = {
  // daftar group, filter q, faculty, type, pagination
  list: (params = {}) => api.get('/groups', { params }),

  // detail 1 group
  detail: (groupId) => api.get(`/groups/${groupId}`),

  // buat group baru
  create: (payload) => api.post('/groups', payload),

  // join / leave
  join: (groupId) => api.post(`/groups/${groupId}/join`),
  leave: (groupId) => api.post(`/groups/${groupId}/leave`),

  // list member group
  members: (groupId) => api.get(`/groups/${groupId}/members`),

  // global public forum feed (semua group yang tidak private)
  globalFeed: (params = {}) => api.get('/groups/posts/feed', { params }),

  // list post dalam 1 group
  listPosts: (groupId, params = {}) =>
    api.get(`/groups/${groupId}/posts`, { params }),

  // detail post dalam group
  getPost: (groupId, postId) =>
    api.get(`/groups/${groupId}/posts/${postId}`),

  // buat post baru dalam group
  createPost: (groupId, payload) =>
    api.post(`/groups/${groupId}/posts`, payload),

  // replies
  listReplies: (groupId, postId) =>
    api.get(`/groups/${groupId}/posts/${postId}/replies`),

  addReply: (groupId, postId, payload) =>
    api.post(`/groups/${groupId}/posts/${postId}/replies`, payload),

  // tandai reply sebagai jawaban
  markAnswer: (groupId, postId, replyId) =>
    api.post(
      `/groups/${groupId}/posts/${postId}/replies/${replyId}/mark-answer`
    ),
};

export default api;
