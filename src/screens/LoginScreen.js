import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { authService } from '../services/auth';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, complete todos los campos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('token', response.access_token);
      navigation.navigate('Camera');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    // Implementar autenticación con Google
    Alert.alert('Info', 'Autenticación con Google pronto disponible');
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
      />
      
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.googleButton]} 
        onPress={handleGoogleAuth}
      >
        <Text style={styles.buttonText}>Iniciar sesión con Google</Text>
      </TouchableOpacity>

      <View style={styles.links}>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Crear cuenta</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => Alert.alert('Info', 'Funcionalidad pronto disponible')}>
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
  googleButton: {
    backgroundColor: '#DB4437',
  },
  buttonText: {
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