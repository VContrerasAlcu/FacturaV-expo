// src/screens/PreviewScreen.js
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  ScrollView,
  Dimensions 
} from 'react-native';
import { invoiceService } from '../services/invoice.js';
import { useAuth } from '../context/AuthContext.js';
import { Ionicons } from '@expo/vector-icons';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Función de compresión de imágenes
const compressImage = async (imageUri, maxSizeMB = 3) => {
  try {
    const imageInfo = await FileSystem.getInfoAsync(imageUri);
    
    if (!imageInfo.exists) {
      return imageUri;
    }
    
    const sizeMB = imageInfo.size / 1024 / 1024;
    
    if (sizeMB <= maxSizeMB) {
      return imageUri;
    }
    
    const compressionRatio = Math.min(0.7, maxSizeMB / sizeMB);
    const quality = Math.floor(compressionRatio * 100);
    
    const compressedImage = await manipulateAsync(
      imageUri,
      [{ resize: { width: 1024 } }],
      { compress: quality / 100, format: SaveFormat.JPEG }
    );
    
    return compressedImage.uri;
  } catch (error) {
    console.error('Error comprimiendo imagen:', error);
    return imageUri;
  }
};

// 🆕 Componente para mostrar agrupación detectada
const AgrupacionInfo = ({ agrupacion, onConfirm, onCancel }) => {
  if (!agrupacion) return null;

  return (
    <View style={styles.agrupacionContainer}>
      <Text style={styles.agrupacionTitle}>📑 Agrupación Detectada</Text>
      <Text style={styles.agrupacionText}>
        Se detectaron {agrupacion.total_facturas} factura(s) 
        ({agrupacion.facturas_multipagina} multipágina)
      </Text>
      
      <ScrollView style={styles.agrupacionList}>
        {agrupacion.detalles.map((factura, index) => (
          <View key={index} style={styles.facturaItem}>
            <Text style={styles.facturaNombre}>
              {factura.nombre_base} 
              {factura.es_multipagina ? ` (${factura.paginas.length} páginas)` : ''}
            </Text>
            {factura.es_multipagina && (
              <Text style={styles.paginasText}>
                Páginas: {factura.paginas.map(p => p.numero_pagina).join(', ')}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.agrupacionActions}>
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={onCancel}
        >
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={onConfirm}
        >
          <Text style={styles.buttonText}>Procesar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const PreviewScreen = ({ navigation }) => {
  const { capturedImages, removeCapturedImage, clearCapturedImages } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [agrupacionDetectada, setAgrupacionDetectada] = useState(null);
  const [mostrarAgrupacion, setMostrarAgrupacion] = useState(false);

  // 🆕 Función para detectar agrupación antes del envío
  const detectarAgrupacion = async () => {
    if (capturedImages.length === 0) {
      Alert.alert('Error', 'No hay imágenes para enviar');
      return;
    }

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      
      // Agregar todas las imágenes al FormData
      for (let i = 0; i < capturedImages.length; i++) {
        const image = capturedImages[i];
        const compressedUri = await compressImage(image.uri);
        
        const file = {
          uri: compressedUri,
          type: 'image/jpeg',
          name: image.uri.split('/').pop() || `invoice_${i + 1}.jpg`
        };
        
        formData.append('files', file);
      }

      console.log('Detectando agrupación...');
      const agrupacion = await invoiceService.detectAgrupacion(formData);
      setAgrupacionDetectada(agrupacion);
      setMostrarAgrupacion(true);
      
    } catch (error) {
      console.error('Error detectando agrupación:', error);
      // Si falla la detección, proceder con envío normal
      handleSendAll();
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Función para enviar con procesamiento multipágina
  const handleSendMultipage = async () => {
    setIsLoading(true);
    setMostrarAgrupacion(false);
    
    try {
      const formData = new FormData();
      
      for (let i = 0; i < capturedImages.length; i++) {
        const image = capturedImages[i];
        const compressedUri = await compressImage(image.uri);
        
        const file = {
          uri: compressedUri,
          type: 'image/jpeg',
          name: image.uri.split('/').pop() || `invoice_${i + 1}.jpg`
        };
        
        formData.append('files', file);
      }

      console.log('Enviando como multipágina...');
      const response = await invoiceService.uploadMultipage(formData);
      
      if (response.success) {
        Alert.alert('✅ Éxito', response.message, [
          { 
            text: 'OK', 
            onPress: () => {
              clearCapturedImages();
              navigation.navigate('Camera');
            }
          }
        ]);
      } else {
        Alert.alert('⚠️ Procesamiento completado', response.message);
      }
    } catch (error) {
      console.error('Error al subir facturas multipágina:', error);
      Alert.alert('❌ Error', 'Error al procesar las imágenes. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 Función para enviar con procesamiento normal
  const handleSendNormal = async () => {
    setIsLoading(true);
    setMostrarAgrupacion(false);
    
    try {
      const formData = new FormData();
      
      for (let i = 0; i < capturedImages.length; i++) {
        const image = capturedImages[i];
        const compressedUri = await compressImage(image.uri);
        
        const file = {
          uri: compressedUri,
          type: 'image/jpeg',
          name: image.uri.split('/').pop() || `invoice_${i + 1}.jpg`
        };
        
        formData.append('files', file);
      }

      console.log('Enviando procesamiento normal...');
      const response = await invoiceService.uploadInvoices(formData);
      
      if (response.success) {
        Alert.alert('✅ Éxito', response.message, [
          { 
            text: 'OK', 
            onPress: () => {
              clearCapturedImages();
              navigation.navigate('Camera');
            }
          }
        ]);
      } else {
        Alert.alert('⚠️ Procesamiento completado', response.message);
      }
    } catch (error) {
      console.error('Error al subir facturas:', error);
      Alert.alert('❌ Error', 'Error al procesar las imágenes. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Función original modificada para usar detección automática
  const handleSendAll = async () => {
    if (capturedImages.length === 0) {
      Alert.alert('Error', 'No hay imágenes para enviar');
      return;
    }

    // 🆕 Primero detectar agrupación
    await detectarAgrupacion();
  };

  const handleRemoveImage = (imageId) => {
    Alert.alert(
      'Eliminar imagen',
      '¿Estás seguro de que quieres eliminar esta imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => {
            removeCapturedImage(imageId);
            if (currentIndex >= capturedImages.length - 1) {
              setCurrentIndex(Math.max(0, capturedImages.length - 2));
            }
          }
        }
      ]
    );
  };

  const handleAddMore = () => {
    navigation.navigate('Camera');
  };

  const handleRetakeAll = () => {
    Alert.alert(
      'Eliminar todas',
      '¿Eliminar todas las imágenes?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => {
            clearCapturedImages();
            navigation.navigate('Camera');
          }
        }
      ]
    );
  };

  // 🆕 Si estamos mostrando la agrupación, mostrar ese modal
  if (mostrarAgrupacion && agrupacionDetectada) {
    return (
      <View style={styles.modalContainer}>
        <AgrupacionInfo 
          agrupacion={agrupacionDetectada}
          onConfirm={handleSendMultipage}
          onCancel={() => {
            setMostrarAgrupacion(false);
            handleSendNormal();
          }}
        />
      </View>
    );
  }

  if (capturedImages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={80} color="#ccc" />
        <Text style={styles.emptyTitle}>No hay imágenes</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('Camera')}
        >
          <Text style={styles.buttonText}>Capturar imágenes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {capturedImages.length} imagen(es) capturada(s)
        </Text>
        {agrupacionDetectada && (
          <Text style={styles.agrupacionBadge}>
            📑 {agrupacionDetectada.facturas_multipagina} multipágina detectadas
          </Text>
        )}
      </View>

      <View style={styles.previewContainer}>
        <Image 
          source={{ uri: capturedImages[currentIndex]?.uri }} 
          style={styles.previewImage} 
        />
        
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            onPress={() => setCurrentIndex(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.counter}>{currentIndex + 1}/{capturedImages.length}</Text>
          
          <TouchableOpacity
            style={[styles.navButton, currentIndex === capturedImages.length - 1 && styles.navButtonDisabled]}
            onPress={() => setCurrentIndex(currentIndex + 1)}
            disabled={currentIndex === capturedImages.length - 1}
          >
            <Ionicons name="chevron-forward" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.thumbnails}>
        <Text style={styles.thumbnailsTitle}>Miniaturas:</Text>
        <ScrollView horizontal>
          {capturedImages.map((image, index) => (
            <TouchableOpacity 
              key={image.id} 
              onPress={() => setCurrentIndex(index)}
              style={styles.thumbnailContainer}
            >
              <Image 
                source={{ uri: image.uri }} 
                style={[
                  styles.thumbnail,
                  index === currentIndex && styles.thumbnailActive
                ]} 
              />
              <TouchableOpacity 
                style={styles.deleteThumbnail}
                onPress={() => handleRemoveImage(image.id)}
              >
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.actions}>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text>Procesando imágenes...</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={handleSendAll}
            >
              <Ionicons name="send" size={20} color="white" />
              <Text style={styles.buttonText}>
                Enviar {capturedImages.length} imagen(es)
              </Text>
            </TouchableOpacity>

            <View style={styles.secondaryButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton, styles.addButton]}
                onPress={handleAddMore}
              >
                <Ionicons name="add" size={18} color="white" />
                <Text style={styles.secondaryButtonText}>Agregar más</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton, styles.deleteButton]}
                onPress={handleRetakeAll}
              >
                <Ionicons name="trash" size={18} color="white" />
                <Text style={styles.secondaryButtonText}>Eliminar todas</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

// 🆕 Estilos para el modal de agrupación
const styles = StyleSheet.create({
  // ... (todos los estilos anteriores se mantienen igual)
  
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    justifyContent: 'center',
  },
  agrupacionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  agrupacionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  agrupacionText: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
    color: '#666',
  },
  agrupacionList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  facturaItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  facturaNombre: {
    fontSize: 14,
    fontWeight: '600',
  },
  paginasText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  agrupacionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  agrupacionBadge: {
    fontSize: 12,
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 5,
  },
  
  // ESTILOS EXISTENTES (se mantienen igual)
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#666',
    marginVertical: 20,
  },
  header: {
    padding: 15,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  navigation: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  navButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  counter: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  thumbnails: {
    padding: 15,
    backgroundColor: 'white',
  },
  thumbnailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  thumbnailContainer: {
    marginRight: 10,
    position: 'relative',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#007AFF',
  },
  deleteThumbnail: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    padding: 20,
    backgroundColor: 'white',
  },
  loading: {
    alignItems: 'center',
    padding: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#34C759', // Verde
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
  },
  addButton: {
    backgroundColor: '#007AFF', // Azul
  },
  deleteButton: {
    backgroundColor: '#FF3B30', // Rojo
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    textAlign: 'center',
  },
});

export default PreviewScreen;