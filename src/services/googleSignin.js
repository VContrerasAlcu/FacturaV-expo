// src/services/googleSignin.js
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { authService } from './auth';
import { Platform } from 'react-native';

// Configurar Google Signin
GoogleSignin.configure({
  // ✅ CLIENT ID de ANDROID (no el web)
  webClientId: '489825905863-bm9tmc1hki5midj0amvbb9bdnnu4d574.apps.googleusercontent.com',
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});

export const googleSignInService = {
  signIn: async () => {
    try {
      console.log('🔄 Iniciando Google SignIn...');
      
      // Verificar que Google Play Services está disponible (solo Android)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices();
      }
      
      // Iniciar sesión
      const userInfo = await GoogleSignin.signIn();
      console.log('✅ Usuario de Google:', userInfo.user);
      
      // Obtener tokens
      const tokens = await GoogleSignin.getTokens();
      console.log('✅ Tokens obtenidos');
      
      return {
        user: userInfo.user,
        tokens: tokens
      };
      
    } catch (error) {
      console.error('❌ Error Google SignIn:', error);
      
      if (error.code === 'SIGN_IN_CANCELLED') {
        throw new Error('Inicio de sesión cancelado');
      } else if (error.code === 'IN_PROGRESS') {
        throw new Error('Operación ya en progreso');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        throw new Error('Google Play Services no disponible');
      } else {
        throw new Error('Error en autenticación Google: ' + error.message);
      }
    }
  },

  signOut: async () => {
    try {
      await GoogleSignin.signOut();
      console.log('✅ Sesión de Google cerrada');
    } catch (error) {
      console.error('❌ Error cerrando sesión Google:', error);
    }
  },

  isSignedIn: async () => {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      return isSignedIn;
    } catch (error) {
      console.error('❌ Error verificando sesión:', error);
      return false;
    }
  },

  getCurrentUser: async () => {
    try {
      const userInfo = await GoogleSignin.getCurrentUser();
      return userInfo;
    } catch (error) {
      console.error('❌ Error obteniendo usuario actual:', error);
      return null;
    }
  }
};