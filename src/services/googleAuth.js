import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { authService } from './auth';

WebBrowser.maybeCompleteAuthSession();

export const googleAuthService = {
  useGoogleAuth: () => {
    const [request, response, promptAsync] = Google.useAuthRequest({
      clientId: '489825905863-vr8ttejnpo4e58u3m6oau9e2es6bp4v3.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
    });

    return {
      request,
      response,
      promptAsync,
    };
  },

  handleGoogleAuth: async (token) => {
    try {
      console.log('🔐 Enviando token Google al servidor...');
      
      const response = await fetch('https://facturav-servidor.onrender.com/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error en autenticación Google');
      }

      const data = await response.json();
      console.log('✅ Login Google exitoso');
      return data;
      
    } catch (error) {
      console.error('❌ Error en autenticación Google:', error);
      throw error;
    }
  },

  getGoogleConfig: async () => {
    try {
      const response = await fetch('https://facturav-servidor.onrender.com/api/auth/google/config');
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo configuración Google:', error);
      return null;
    }
  }
};