import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { invoiceService } from '../services/invoice';

const PreviewScreen = ({ navigation, route }) => {
  const { photo } = route.params;
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    setIsLoading(true);
    try {
      // Crear FormData y agregar la imagen
      const formData = new FormData();
      
      // Convertir la imagen a un formato que se pueda enviar
      const file = {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'invoice.jpg'
      };
      
      formData.append('file', file);

      const response = await invoiceService.uploadInvoice(formData);
      
      if (response.success) {
        Alert.alert('Éxito', response.message, [
          { text: 'OK', onPress: () => navigation.navigate('Camera') }
        ]);
      } else {
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.error('Error uploading invoice:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Error al procesar la imagen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetake = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: photo.uri }} style={styles.preview} />
      
      <View style={styles.buttonContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : (
          <>
            <TouchableOpacity 
              style={[styles.button, styles.sendButton]}
              onPress={handleSend}
            >
              <Text style={styles.buttonText}>Enviar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.retakeButton]}
              onPress={handleRetake}
            >
              <Text style={styles.buttonText}>Repetir Captura</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: '#34C759',
  },
  retakeButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PreviewScreen;