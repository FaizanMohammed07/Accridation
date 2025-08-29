import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && localStorage.getItem('refreshToken')) {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        });
        
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        
        // Retry original request
        return api.request(error.config);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getInstitutes: () => api.get('/admin/institutes'),
  createInstitute: (data) => api.post('/admin/institutes', data),
  updateInstitute: (id, data) => api.put(`/admin/institutes/${id}`, data),
  getReviewers: () => api.get('/admin/reviewers'),
  getAuditors: () => api.get('/admin/auditors'),
  assignReviewer: (data) => api.post('/admin/assign-reviewer', data),
  assignAuditor: (data) => api.post('/admin/assign-auditor', data),
  getUsers: () => api.get('/admin/users'),
  updateUserStatus: (id, data) => api.put(`/admin/users/${id}/status`, data),
  getReports: () => api.get('/admin/reports'),
};

// Document API
export const documentAPI = {
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDocuments: (params) => api.get('/documents', { params }),
  getAssignedDocuments: () => api.get('/documents/assigned'),
  getDocument: (id) => api.get(`/documents/${id}`),
  updateDocument: (id, data) => api.put(`/documents/${id}`, data),
  deleteDocument: (id) => api.delete(`/documents/${id}`),
  downloadDocument: (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
  getDocumentHistory: (id) => api.get(`/documents/${id}/history`),
  updateDocumentStatus: (id, data) => api.put(`/documents/${id}/status`, data),
};

// Review API
export const reviewAPI = {
  getDashboard: () => api.get('/reviews/dashboard'),
  startReview: (documentId) => api.post(`/reviews/start/${documentId}`),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  submitReview: (id, data) => api.post(`/reviews/${id}/submit`, data),
  getReview: (id) => api.get(`/reviews/${id}`),
  getDocumentReviews: (documentId) => api.get(`/reviews/document/${documentId}`),
};

// Audit API
export const auditAPI = {
  getDashboard: () => api.get('/audits/dashboard'),
  startAudit: (documentId) => api.post(`/audits/start/${documentId}`),
  updateAudit: (id, data) => api.put(`/audits/${id}`, data),
  submitAudit: (id, data) => api.post(`/audits/${id}/submit`, data),
  addFinding: (id, data) => api.post(`/audits/${id}/findings`, data),
  updateCompliance: (id, data) => api.put(`/audits/${id}/compliance`, data),
  validateReview: (id, data) => api.post(`/audits/${id}/validate-review`, data),
  getAudit: (id) => api.get(`/audits/${id}`),
  getDocumentAudits: (documentId) => api.get(`/audits/document/${documentId}`),
};

// Log API
export const logAPI = {
  getLogs: (params) => api.get('/logs', { params }),
  getUserLogs: (userId) => api.get(`/logs/user/${userId}`),
  getLogsSummary: () => api.get('/logs/summary'),
  exportLogs: (data) => api.post('/logs/export', data),
  cleanupLogs: () => api.delete('/logs/cleanup'),
};

export default api;