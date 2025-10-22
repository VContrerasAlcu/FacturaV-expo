import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, Linking, Image } from 'react-native';
import { useAuth } from '../context/AuthContext.js';
import { authService } from '../services/auth.js';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn } = useAuth();

  // Manejar mensajes del navegador
  useEffect(() => {
    const handleMessage = (event) => {
      console.log('📨 Mensaje recibido:', event.data);
      
      if (event.data && event.data.type) {
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          console.log('✅ Autenticación Google exitosa');
          handleGoogleSuccess(event.data.token, event.data.user);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          console.error('❌ Error en autenticación Google:', event.data.error);
          Alert.alert('Error', `Error en autenticación: ${event.data.error}`);
          setGoogleLoading(false);
        }
      }
    };

    if (window.addEventListener) {
      window.addEventListener('message', handleMessage);
    }

    return () => {
      if (window.removeEventListener) {
        window.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  const handleGoogleSuccess = async (token, userData) => {
    try {
      console.log('🔄 Procesando token JWT recibido...');
      await signIn(token);
      Alert.alert('Éxito', `Bienvenido ${userData.nombre || userData.email}`);
    } catch (error) {
      console.error('❌ Error procesando token:', error);
      Alert.alert('Error', 'Error al procesar la autenticación');
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
      console.log('🔄 Solicitando URL de Google al servidor...');
      
      const response = await fetch('https://facturav-servidor.onrender.com/api/auth/google/url');
      
      if (!response.ok) {
        throw new Error(`Error ${response.status} del servidor`);
      }
      
      const data = await response.json();
      console.log('📦 Datos recibidos:', data);
      
      if (data.success && data.auth_url) {
        console.log('🔗 URL obtenida correctamente');
        
        const supported = await Linking.canOpenURL(data.auth_url);
        if (supported) {
          await Linking.openURL(data.auth_url);
          Alert.alert(
            'Autenticación Google', 
            'Se abrirá el navegador para autenticarte con Google.',
            [{ text: 'Entendido' }]
          );
        } else {
          throw new Error('No se puede abrir la URL en este dispositivo');
        }
      } else {
        throw new Error(data.detail || data.error || 'Error del servidor');
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
      Alert.alert('Error', error.message);
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

      {/* Botón Google Mejorado */}
      <TouchableOpacity 
        style={[styles.googleButton, googleLoading && styles.buttonDisabled]} 
        onPress={handleGoogleAuth}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <ActivityIndicator color="#757575" />
        ) : (
          <View style={styles.googleButtonContent}>
            <View style={styles.googleLogoContainer}>
              {/* Logo de Google como texto o imagen */}
              <Text style={styles.googleLogo}>G</Text>
            </View>
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.links}>
        <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={isLoading || googleLoading}>
          <Text style={styles.link}>Crear cuenta</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleForgotPassword} disabled={isLoading || googleLoading}>
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
    fontSize: 16,
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
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
    fontWeight: '500',
  },
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
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogoContainer: {
    width: 20,
    height: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleLogo: {
    width: 18,
    height: 18,
  },
  googleLogoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#757575',
  },
  googleButtonText: {
    color: '#3c4043',
    fontSize: 16,
    fontWeight: '500',
  },
  links: {
    marginTop: 20,
    alignItems: 'center',
  },
  link: {
    color: '#007AFF',
    marginBottom: 10,
    fontSize: 16,
  },
});

export default LoginScreen;