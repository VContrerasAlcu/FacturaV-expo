// src/services/auth.js - VERSIÓN COMPLETA CORREGIDA
import api from './api.js';

export const authService = {
  login: async (email, password) => {
    try {
      console.log('🔄 Intentando login para:', email);
      
      // ✅ CORREGIDO: Usar URLSearchParams en lugar de FormData
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await api.post('/api/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      console.log('✅ Login exitoso');
      return response.data;
    } catch (error) {
      console.error('❌ Error en login:', error);
      
      // Manejo específico de errores
      if (error.response?.status === 401) {
        throw new Error('Email o contraseña incorrectos');
      } else if (error.response?.status === 422) {
        throw new Error('Datos inválidos. Verifica el formato.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Error de conexión. Verifica tu internet.');
      } else {
        throw new Error(error.response?.data?.detail || 'Error al iniciar sesión');
      }
    }
  },

  register: async (userData) => {
    try {
      console.log('🔄 Registrando usuario:', userData.email);
      
      const response = await api.post('/api/register', userData);
      
      console.log('✅ Registro exitoso');
      return response.data;
    } catch (error) {
      console.error('❌ Error en registro:', error);
      
      if (error.response?.status === 409) {
        throw new Error('El usuario ya existe');
      } else if (error.response?.status === 422) {
        throw new Error('Datos inválidos. Verifica los campos.');
      } else {
        throw new Error(error.response?.data?.detail || 'Error al registrar usuario');
      }
    }
  },

  verifyCode: async (email, code) => {
    try {
      console.log('🔄 Verificando código para:', email);
      
      const response = await api.post('/api/verify-code', { 
        email: email, 
        code: code 
      });
      
      console.log('✅ Código verificado exitosamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error verificando código:', error);
      
      if (error.response?.status === 400) {
        throw new Error('Código inválido o expirado');
      } else {
        throw new Error(error.response?.data?.detail || 'Error verificando código');
      }
    }
  },

  forgotPassword: async (email) => {
    try {
      console.log('🔄 Solicitando recuperación para:', email);
      
      // ✅ ENVIAR COMO JSON OBJECT
      const response = await api.post('/api/forgot-password', { 
        email: email 
      });
      
      console.log('✅ Solicitud de recuperación enviada');
      return response.data;
    } catch (error) {
      console.error('❌ Error en forgot-password:', error);
      
      // Manejo específico de errores
      if (error.response?.status === 422) {
        throw new Error('Email inválido. Verifica el formato.');
      } else if (error.response?.status === 404) {
        // Por seguridad, mostrar mensaje genérico aunque el email no exista
        throw new Error('Si el email existe, recibirás un código de verificación');
      } else {
        throw new Error(error.response?.data?.detail || 'Error solicitando recuperación');
      }
    }
  },

  resetPassword: async (email, code, newPassword) => {
    try {
      console.log('🔄 Actualizando contraseña para:', email);
      
      const response = await api.post('/api/reset-password', { 
        email: email, 
        code: code, 
        new_password: newPassword 
      });
      
      console.log('✅ Contraseña actualizada exitosamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error en reset-password:', error);
      
      if (error.response?.status === 400) {
        throw new Error('Código inválido o expirado');
      } else if (error.response?.status === 422) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      } else {
        throw new Error(error.response?.data?.detail || 'Error actualizando contraseña');
      }
    }
  },

  getCurrentUser: async () => {
    try {
      console.log('🔄 Obteniendo información del usuario actual');
      
      const response = await api.get('/api/me');
      
      console.log('✅ Información de usuario obtenida');
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo usuario:', error);
      
      if (error.response?.status === 401) {
        throw new Error('No autenticado. Inicia sesión nuevamente.');
      } else {
        throw new Error(error.response?.data?.detail || 'Error obteniendo información del usuario');
      }
    }
  },

  // ✅ MÉTODO EXTRA: Verificar si el token es válido
  validateToken: async () => {
    try {
      const response = await api.get('/api/me');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
};