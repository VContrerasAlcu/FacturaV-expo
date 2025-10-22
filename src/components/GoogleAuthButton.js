// src/components/GoogleAuthButton.js
import React, { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

const GoogleAuthButton = ({ onSuccess, onError, disabled }) => {
  const [loading, setLoading] = useState(false);
  
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '489825905863-vr8ttejnpo4e58u3m6oau9e2es6bp4v3.apps.googleusercontent.com',
    scopes: ['openid', 'profile', 'email'],
  });

  // Manejar respuesta de Google
  React.useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response);
    } else if (response?.type === 'error') {
      console.error('❌ Error Google Auth:', response.error);
      setLoading(false);
      onError?.('Error en autenticación Google');
    }
  }, [response]);

  const handleGoogleResponse = async (response) => {
    try {
      setLoading(true);
      const token = response.authentication.accessToken;
      
      // Enviar token al servidor
      const serverResponse = await fetch('https://facturav-servidor.onrender.com/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!serverResponse.ok) {
        const errorData = await serverResponse.json();
        throw new Error(errorData.detail || 'Error del servidor');
      }

      const data = await serverResponse.json();
      onSuccess?.(data);
      
    } catch (error) {
      console.error('❌ Error completo Google Auth:', error);
      onError?.(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = async () => {
    try {
      setLoading(true);
      await promptAsync();
    } catch (error) {
      console.error('❌ Error iniciando Google Auth:', error);
      setLoading(false);
      onError?.('No se pudo iniciar la autenticación');
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.googleButton,
        (loading || disabled) && styles.buttonDisabled
      ]}
      onPress={handlePress}
      disabled={loading || disabled || !request}
    >
      {loading ? (
        <ActivityIndicator color="#757575" />
      ) : (
        <Text style={styles.googleButtonText}>
          Continuar con Google
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = {
  googleButton: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#dadce0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    color: '#3c4043',
    fontSize: 16,
    fontWeight: '500',
  },
};

export default GoogleAuthButton;