// lib/axios.ts - FIXED TO MATCH YOUR URL STRUCTURE

import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response, 
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh = localStorage.getItem('refresh');
        const res = await axios.post(`${API_URL}/api/token/refresh/`, {  // Changed from /api/refresh/ to /api/token/refresh/
          refresh,
        });

        localStorage.setItem('access', res.data.access);

        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
        return api(originalRequest);

      } catch (refreshError) {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Get current user - NOW CORRECT: /api/users/me/
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/api/users/me/');
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

interface UpdateUserProfileData {
  first_name?: string;
  last_name?: string;
  email?: string;
}

// Update user profile - /api/users/profile/update/
export const updateUserProfile = async (data: UpdateUserProfileData) => {
  const response = await api.patch('/api/users/profile/update/', data);
  return response.data;
};

// Upload profile image - /api/users/profile/upload-picture/
export const uploadProfileImage = async (file: File) => {
  const formData = new FormData();
  formData.append('picture', file);
  
  const response = await api.post('/api/users/profile/upload-picture/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export default api;