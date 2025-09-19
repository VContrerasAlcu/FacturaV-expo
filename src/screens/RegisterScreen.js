import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { authService } from '../services/auth.js';

const RegisterScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    dni_cif: '',
    direccion: ''
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Email y contraseña son obligatorios');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      await authService.register(formData);
      setStep(2);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al registrar usuario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Por favor, ingresa el código de verificación');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.verifyCode(formData.email, verificationCode);
      localStorage.setItem('token', response.access_token);
      navigation.navigate('Camera');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.detail || 'Código inválido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>

      {step === 1 ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email *"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Contraseña *"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            secureTextEntry
          />
          
          <TextInput
            style={styles.input}
            placeholder="Confirmar contraseña *"
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            secureTextEntry
          />
          
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={formData.nombre}
            onChangeText={(value) => handleInputChange('nombre', value)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="DNI/CIF"
            value={formData.dni_cif}
            onChangeText={(value) => handleInputChange('dni_cif', value)}
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Dirección"
            value={formData.direccion}
            onChangeText={(value) => handleInputChange('direccion', value)}
            multiline
            numberOfLines={3}
          />
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Enviando código...' : 'Registrarse'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.verificationText}>
            Se ha enviado un código de verificación a {formData.email}
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Código de verificación"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
          />
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleVerifyCode}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Verificando...' : 'Verificar código'}
            </Text>
          </TouchableOpacity>
        </>
      )}
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
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  verificationText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default RegisterScreen;