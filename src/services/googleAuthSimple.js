// src/services/googleAuthSimple.js
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  try {
    const [request, response, promptAsync] = Google.useAuthRequest({
      clientId: '489825905863-vr8ttejnpo4e58u3m6oau9e2es6bp4v3.apps.googleusercontent.com',
      scopes: ['openid', 'profile', 'email'],
    });

    return {
      request,
      response,
      promptAsync,
    };
  } catch (error) {
    console.error('❌ Error en useGoogleAuth:', error);
    return {
      request: null,
      response: null,
      promptAsync: () => Promise.reject(error),
    };
  }
};

export const googleAuthService = {
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
  }
};