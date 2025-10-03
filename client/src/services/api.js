import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses and errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

// Images API
export const imagesAPI = {
  upload: (formData) => {
    return api.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  uploadMultiple: (formData) => {
    return api.post('/images/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getAll: (params) => api.get('/images', { params }),
  
  getById: (id) => api.get(`/images/${id}`),
  
  delete: (id) => api.delete(`/images/${id}`),
  
  getMetadata: (id) => api.get(`/images/${id}/metadata`),
  
  transform: (id, type, params) => api.post(`/images/${id}/transform`, { type, options: params }),
  
  batchTransform: (id, transformations) => api.post(`/images/${id}/batch-transform`, { transformations }),
  
  getTransformations: (id) => api.get(`/images/${id}/transformations`),
  
  deleteTransformation: (imageId, transformationId) => 
    api.delete(`/images/${imageId}/transformations/${transformationId}`),
};

export default api;