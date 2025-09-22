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
    // Obtener información de la imagen
    const imageInfo = await FileSystem.getInfoAsync(imageUri);
    
    if (!imageInfo.exists) {
      console.log('La imagen no existe en la URI proporcionada');
      return imageUri;
    }
    
    const sizeMB = imageInfo.size / 1024 / 1024;
    
    // Si la imagen es menor que el tamaño máximo, no comprimir
    if (sizeMB <= maxSizeMB) {
      console.log(`Imagen de ${sizeMB.toFixed(2)}MB no necesita compresión`);
      return imageUri;
    }
    
    // Calcular factor de compresión (máximo 70% de calidad)
    const compressionRatio = Math.min(0.7, maxSizeMB / sizeMB);
    const quality = Math.floor(compressionRatio * 100);
    
    console.log(`Comprimiendo imagen de ${sizeMB.toFixed(2)}MB a calidad ${quality}%`);
    
    // Comprimir imagen
    const compressedImage = await manipulateAsync(
      imageUri,
      [{ resize: { width: 1024 } }], // Redimensionar ancho máximo 1024px
      { compress: quality / 100, format: SaveFormat.JPEG }
    );
    
    const compressedInfo = await FileSystem.getInfoAsync(compressedImage.uri);
    console.log(`Imagen comprimida: ${(compressedInfo.size / 1024 / 1024).toFixed(2)}MB`);
    
    return compressedImage.uri;
  } catch (error) {
    console.error('Error comprimiendo imagen:', error);
    return imageUri; // Devolver original en caso de error
  }
};

const PreviewScreen = ({ navigation }) => {
  const { capturedImages, removeCapturedImage, clearCapturedImages } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [compressionProgress, setCompressionProgress] = useState({});

  const handleSendAll = async () => {
    if (capturedImages.length === 0) {
      Alert.alert('Error', 'No hay imágenes para enviar');
      return;
    }

    setIsLoading(true);
    setCompressionProgress({});
    
    try {
      const formData = new FormData();
      let compressionErrors = [];
      
      // Comprimir y agregar todas las imágenes al FormData
      for (let i = 0; i < capturedImages.length; i++) {
        const image = capturedImages[i];
        
        try {
          setCompressionProgress(prev => ({
            ...prev,
            [i]: { status: 'comprimiendo', progress: 0 }
          }));
          
          console.log(`Comprimiendo imagen ${i + 1} de ${capturedImages.length}`);
          
          // Comprimir imagen antes de enviar
          const compressedUri = await compressImage(image.uri);
          
          setCompressionProgress(prev => ({
            ...prev,
            [i]: { status: 'comprimido', progress: 100 }
          }));
          
          const file = {
            uri: compressedUri,
            type: 'image/jpeg',
            name: `invoice_${i + 1}.jpg`
          };
          
          formData.append('files', file);
          console.log(`Imagen ${i + 1} comprimida y agregada al formulario`);
          
        } catch (compressionError) {
          console.error(`Error comprimiendo imagen ${i + 1}:`, compressionError);
          compressionErrors.push(`Imagen ${i + 1}`);
          
          // En caso de error, usar la imagen original
          const file = {
            uri: image.uri,
            type: 'image/jpeg',
            name: `invoice_${i + 1}.jpg`
          };
          
          formData.append('files', file);
        }
      }
      
      if (compressionErrors.length > 0) {
        console.warn(`Errores en compresión: ${compressionErrors.join(', ')}`);
      }
      
      console.log('Enviando', capturedImages.length, 'imágenes comprimidas al servidor');

      const response = await invoiceService.uploadInvoices(formData);
      console.log('Respuesta del servidor:', response);
      
      if (response.success) {
        Alert.alert(
          'Éxito', 
          response.message,
          [
            { 
              text: 'OK', 
              onPress: () => {
                clearCapturedImages();
                navigation.navigate('Camera');
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Procesamiento completado', 
          response.message,
          [
            { 
              text: 'Ver detalles', 
              onPress: () => showProcessingDetails(response.details)
            },
            { 
              text: 'Aceptar', 
              onPress: () => {
                clearCapturedImages();
                navigation.navigate('Camera');
              },
              style: 'default'
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error detallado al subir facturas:', error);
      
      let errorMessage = 'Error al procesar las imágenes';
      let errorDetails = '';
      
      if (error.response) {
        // El servidor respondió con un código de error
        errorMessage = `Error ${error.response.status}`;
        if (error.response.data) {
          errorDetails = error.response.data.detail || error.response.data.message || 'Error del servidor';
        }
      } else if (error.request) {
        // La request fue hecha pero no hubo respuesta
        errorMessage = 'No se pudo conectar con el servidor';
        errorDetails = 'Verifica tu conexión a internet';
      } else {
        errorDetails = error.message;
      }
      
      Alert.alert(
        'Error', 
        `${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`,
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
      setCompressionProgress({});
    }
  };

  const showProcessingDetails = (details) => {
    if (!details || details.length === 0) return;
    
    const detailText = details.join('\n• ');
    Alert.alert(
      'Detalles del procesamiento',
      `• ${detailText}`,
      [{ text: 'Entendido', style: 'default' }]
    );
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
      'Eliminar todas las imágenes',
      '¿Estás seguro de que quieres eliminar todas las imágenes capturadas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar todas', 
          style: 'destructive',
          onPress: () => {
            clearCapturedImages();
            navigation.navigate('Camera');
          }
        }
      ]
    );
  };

  const getCompressionStatus = (index) => {
    return compressionProgress[index] || { status: 'pendiente', progress: 0 };
  };

  if (capturedImages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={80} color="#ccc" />
        <Text style={styles.emptyTitle}>No hay imágenes capturadas</Text>
        <Text style={styles.emptyText}>
          Captura algunas facturas para comenzar el procesamiento
        </Text>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => navigation.navigate('Camera')}
        >
          <Ionicons name="camera" size={20} color="white" />
          <Text style={styles.primaryButtonText}>Capturar imágenes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentImage = capturedImages[currentIndex];

  return (
    <View style={styles.container}>
      {/* Header con contador */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {capturedImages.length} imagen(es) lista(s) para enviar
        </Text>
        <View style={styles.counterBadge}>
          <Ionicons name="images" size={16} color="white" />
          <Text style={styles.counterText}>{capturedImages.length}</Text>
        </View>
      </View>

      {/* Vista previa de la imagen actual */}
      <View style={styles.previewContainer}>
        <Image 
          source={{ uri: currentImage?.uri }} 
          style={styles.previewImage} 
          resizeMode="contain"
        />
        
        {/* Overlay de navegación */}
        <View style={styles.navigationOverlay}>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            onPress={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          
          <View style={styles.counterContainer}>
            <Text style={styles.counter}>
              {currentIndex + 1} / {capturedImages.length}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.navButton, currentIndex === capturedImages.length - 1 && styles.navButtonDisabled]}
            onPress={() => setCurrentIndex(Math.min(capturedImages.length - 1, currentIndex + 1))}
            disabled={currentIndex === capturedImages.length - 1}
          >
            <Ionicons name="chevron-forward" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Indicador de compresión */}
      {isLoading && (
        <View style={styles.compressionInfo}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.compressionText}>
            Comprimiendo imágenes... {Object.values(compressionProgress).filter(p => p.status === 'comprimido').length}/{capturedImages.length}
          </Text>
        </View>
      )}

      {/* Lista de miniaturas */}
      <View style={styles.thumbnailsContainer}>
        <Text style={styles.thumbnailsTitle}>Imágenes capturadas:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailsScroll}>
          {capturedImages.map((image, index) => (
            <View key={image.id} style={styles.thumbnailWrapper}>
              <TouchableOpacity 
                onPress={() => setCurrentIndex(index)}
                style={styles.thumbnailTouchable}
              >
                <Image 
                  source={{ uri: image.uri }} 
                  style={[
                    styles.thumbnail,
                    index === currentIndex && styles.thumbnailActive
                  ]} 
                />
                {/* Indicador de estado de compresión */}
                {isLoading && (
                  <View style={styles.compressionIndicator}>
                    <Text style={styles.compressionIndicatorText}>
                      {getCompressionStatus(index).status === 'comprimido' ? '✓' : '...'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={() => handleRemoveImage(image.id)}
              >
                <Ionicons name="close-circle" size={20} color="#ff3b30" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Información de consejos */}
      <View style={styles.tipsContainer}>
        <Ionicons name="information-circle" size={16} color="#666" />
        <Text style={styles.tipsText}>
          Consejo: Las imágenes grandes se comprimen automáticamente para un mejor procesamiento
        </Text>
      </View>

      {/* Botones de acción */}
      <View style={styles.buttonContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Procesando imágenes...</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity 
              style={[styles.button, styles.sendButton]}
              onPress={handleSendAll}
              disabled={isLoading}
            >
              <Ionicons name="send" size={20} color="white" />
              <Text style={styles.buttonText}>
                Enviar {capturedImages.length} imagen(es)
              </Text>
            </TouchableOpacity>
            
            <View style={styles.secondaryButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.addButton]}
                onPress={handleAddMore}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.buttonText}>Agregar más</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.retakeButton]}
                onPress={handleRetakeAll}
              >
                <Ionicons name="trash" size={20} color="white" />
                <Text style={styles.buttonText}>Eliminar todas</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  counterText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 14,
  },
  previewContainer: {
    height: screenHeight * 0.4,
    backgroundColor: 'black',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  navigationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  navButton: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 25,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  counterContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  counter: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  compressionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#e3f2fd',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
  },
  compressionText: {
    marginLeft: 10,
    color: '#1976d2',
    fontSize: 14,
  },
  thumbnailsContainer: {
    padding: 15,
    backgroundColor: 'white',
    marginTop: 10,
  },
  thumbnailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  thumbnailsScroll: {
    flexGrow: 0,
  },
  thumbnailWrapper: {
    marginRight: 10,
    position: 'relative',
  },
  thumbnailTouchable: {
    position: 'relative',
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#007AFF',
  },
  compressionIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compressionIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 10,
    zIndex: 1,
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff3cd',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
  },
  tipsText: {
    marginLeft: 8,
    color: '#856404',
    fontSize: 14,
    flex: 1,
    lineHeight: 18,
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: 'white',
    marginTop: 'auto',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  sendButton: {
    backgroundColor: '#34C759',
  },
  addButton: {
    backgroundColor: '#007AFF',
    flex: 1,
    marginRight: 6,
  },
  retakeButton: {
    backgroundColor: '#FF3B30',
    flex: 1,
    marginLeft: 6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PreviewScreen;