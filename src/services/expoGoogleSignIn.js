// src/services/expoGoogleSignIn.js
import * as Google from 'expo-google-sign-in';

export const expoGoogleSignInService = {
  initAsync: async () => {
    try {
      await Google.initAsync({
        clientId: '489825905863-vr8ttejnpo4e58u3m6oau9e2es6bp4v3.apps.googleusercontent.com',
      });
      console.log('✅ Google Sign-In inicializado');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando Google Sign-In:', error);
      return false;
    }
  },

  signIn: async () => {
    try {
      console.log('🔄 Iniciando Google Sign-In...');
      
      // Verificar servicios de Google Play (solo Android)
      await Google.askForPlayServicesAsync();
      
      const result = await Google.signInAsync();
      
      if (result.type === 'success') {
        console.log('✅ Google Sign-In exitoso');
        
        // Obtener tokens
        const { idToken, accessToken } = await result.user.getAuthResponse();
        
        return {
          user: {
            id: result.user.uid,
            email: result.user.email,
            name: result.user.displayName,
            photo: result.user.photoURL,
          },
          tokens: {
            idToken,
            accessToken
          }
        };
      } else {
        throw new Error('Inicio de sesión cancelado por el usuario');
      }
    } catch (error) {
      console.error('❌ Error Google Sign-In:', error);
      
      if (error.message.includes('canceled') || error.message.includes('cancelado')) {
        throw new Error('Inicio de sesión cancelado');
      } else if (error.message.includes('play services')) {
        throw new Error('Google Play Services no disponible');
      } else {
        throw new Error('Error en autenticación Google: ' + error.message);
      }
    }
  },

  signOut: async () => {
    try {
      await Google.signOutAsync();
      console.log('✅ Sesión de Google cerrada');
    } catch (error) {
      console.error('❌ Error cerrando sesión Google:', error);
    }
  }
};