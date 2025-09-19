import api from './api.js';

export const authService = {
  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await api.post('/api/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/api/register', userData);
    return response.data;
  },

  verifyCode: async (email, code) => {
    const response = await api.post('/api/verify-code', { email, code });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/api/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (email, code, newPassword) => {
    const response = await api.post('/api/reset-password', { 
      email, 
      code, 
      new_password: newPassword 
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/me');
    return response.data;
  },
};