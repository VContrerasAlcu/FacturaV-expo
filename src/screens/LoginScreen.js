// src/screens/LoginScreen.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet, 
  ActivityIndicator,
  Image 
} from 'react-native';
import { useAuth } from '../context/AuthContext.js';
import { authService } from '../services/auth.js';
import GoogleAuthButton from '../components/GoogleAuthButton.js'; // ✅ NUEVO

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  // ✅ Manejo de éxito de Google Auth
  const handleGoogleSuccess = async (result) => {
    try {
      await signIn(result.access_token);
      Alert.alert('Éxito', 'Inicio de sesión con Google exitoso');
    } catch (error) {
      console.error('❌ Error en signIn después de Google:', error);
      Alert.alert('Error', 'Error al iniciar sesión');
    }
  };

  // ✅ Manejo de errores de Google Auth
  const handleGoogleError = (errorMessage) => {
    Alert.alert('Error', errorMessage);
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
      console.log('✅ Login exitoso con email/password');
    } catch (error) {
      console.error('❌ Error en login:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Recuperar Contraseña', 'Funcionalidad pronto disponible');
  };

  return (
    <View style={styles.container}>
      
      {/* LOGO */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoading}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
      />
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={isLoading}
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

      {/* ✅ NUEVO: Botón Google Auth como componente separado */}
      <GoogleAuthButton
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        disabled={isLoading}
      />

      <View style={styles.links}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Register')} 
          disabled={isLoading}
        >
          <Text style={styles.link}>Crear cuenta</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleForgotPassword} 
          disabled={isLoading}
        >
          <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ... (estilos iguales, agregar el separador)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 120,
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