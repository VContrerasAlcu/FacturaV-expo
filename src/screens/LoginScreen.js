import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext.js';
import { authService } from '../services/auth.js';
import { googleAuthService } from '../services/googleAuth.js';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

// Configurar Google Auth
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn } = useAuth();

  // Configuración Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '489825905863-vr8ttejnpo4e58u3m6oau9e2es6bp4v3.apps.googleusercontent.com', // Reemplazar con tu Client ID
    scopes: ['profile', 'email'],
  });

  // Manejar respuesta de Google
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response.authentication.accessToken);
    } else if (response?.type === 'error') {
      console.error('Error Google Auth:', response.error);
      Alert.alert('Error', 'Error en autenticación con Google');
      setGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleResponse = async (accessToken) => {
    try {
      setGoogleLoading(true);
      console.log('🔄 Procesando token Google...');
      
      const result = await googleAuthService.handleGoogleAuth(accessToken);
      await signIn(result.access_token);
      
      console.log('✅ Usuario autenticado con Google');
    } catch (error) {
      console.error('❌ Error autenticación Google:', error);
      Alert.alert('Error', error.message || 'Error al iniciar sesión con Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, complete todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      await signIn(response.access_token);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setGoogleLoading(true);
      console.log('🔄 Iniciando autenticación Google...');
      
      await promptAsync();
      // La respuesta se maneja en el useEffect
      
    } catch (error) {
      console.error('❌ Error iniciando Google Auth:', error);
      Alert.alert('Error', 'No se pudo iniciar la autenticación con Google');
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Recuperar Contraseña', 'Funcionalidad pronto disponible');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FacturaV</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading && !googleLoading}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading && !googleLoading}
      />
      
      <TouchableOpacity 
        style={[styles.button, (isLoading || googleLoading) && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={isLoading || googleLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Iniciar sesión</Text>
        )}
      </TouchableOpacity>

      {/* Separador */}
      <View style={styles.separator}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>o</Text>
        <View style={styles.separatorLine} />
      </View>

      {/* Botón Google */}
      <TouchableOpacity 
        style={[styles.googleButton, (isLoading || googleLoading) && styles.buttonDisabled]} 
        onPress={handleGoogleAuth}
        disabled={!request || isLoading || googleLoading}
      >
        {googleLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleButtonText}>Iniciar sesión con Google</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.links}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Register')} 
          disabled={isLoading || googleLoading}
        >
          <Text style={styles.link}>Crear cuenta</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleForgotPassword} 
          disabled={isLoading || googleLoading}
        >
          <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos Google
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  separatorText: {
    marginHorizontal: 15,
    color: '#666',
    fontSize: 14,
  },
  googleButton: {
    height: 50,
    backgroundColor: '#DB4437',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    flexDirection: 'row',
  },
  googleIcon: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  links: {
    marginTop: 20,
    alignItems: 'center',
  },
  link: {
    color: '#007AFF',
    marginBottom: 10,
  },
});

export default LoginScreen;