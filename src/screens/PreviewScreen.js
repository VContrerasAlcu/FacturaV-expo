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
import { pdfService } from '../services/pdfGenerator.js'; 

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

const PreviewScreen = ({ navigation }) => {
  const { 
    capturedImages, 
    removeCapturedImage, 
    clearCapturedImages 
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Preparar datos para enviar al servidor
  const prepareFormData = async () => {
    const formData = new FormData();
    const tempFilesToCleanup = []; // ✅ PARA LIMPIAR ARCHIVOS TEMPORALES

    console.log(`📦 Preparando ${capturedImages.length} elementos para envío como PDF`);

    try {
      for (let i = 0; i < capturedImages.length; i++) {
        const image = capturedImages[i];
        
        console.log(`📄 Procesando elemento ${i + 1}:`, {
          isMultiPage: image.isMultiPage,
          pagesCount: image.pages ? image.pages.length : 0
        });

        let pdfFile;

        if (image.isMultiPage && image.pages) {
          // ✅ CONVERTIR FACTURA MULTIPÁGINA A UN PDF
          console.log(`🔄 Convirtiendo factura multipágina con ${image.pages.length} páginas a PDF`);
          pdfFile = await pdfService.convertImagesToMultiPagePDF(
            image.pages, 
            `factura_multipagina_${i + 1}.pdf`
          );
        } else {
          // ✅ CONVERTIR FACTURA SIMPLE A PDF
          console.log(`🔄 Convirtiendo factura simple a PDF`);
          pdfFile = await pdfService.convertImageToPDF(
            image.uri, 
            `factura_${i + 1}.pdf`
          );
        }

        // Agregar PDF al FormData
        const file = {
          uri: pdfFile.uri,
          type: 'application/pdf',
          name: pdfFile.name
        };
        
        formData.append('files', file);
        tempFilesToCleanup.push(pdfFile.uri); // ✅ GUARDAR PARA LIMPIAR DESPUÉS
        
        console.log(`✅ PDF agregado: ${pdfFile.name}`);
      }

      console.log(`✅ FormData preparado con ${capturedImages.length} archivos PDF`);
      return { formData, tempFilesToCleanup };

    } catch (error) {
      // ✅ LIMPIAR ARCHIVOS TEMPORALES EN CASO DE ERROR
      await pdfService.cleanupTempFiles(tempFilesToCleanup);
      throw error;
    }
};

  const handleSendAll = async () => {
    if (capturedImages.length === 0) {
      Alert.alert('Error', 'No hay imágenes para enviar');
      return;
    }

    setIsLoading(true);
    let tempFilesToCleanup = [];
    
    try {
      // ✅ OBTENER FORMData Y ARCHIVOS TEMPORALES
      const { formData, tempFilesToCleanup: tempFiles } = await prepareFormData();
      tempFilesToCleanup = tempFiles;
      
      console.log('Enviando FormData con', capturedImages.length, 'archivos PDF');
      
      const response = await invoiceService.uploadInvoices(formData);
      console.log('Respuesta del servidor:', response);
      
      if (response.success) {
        Alert.alert('Éxito', response.message, [
          { 
            text: 'OK', 
            onPress: () => {
              clearCapturedImages();
              navigation.navigate('Camera');
            }
          }
        ]);
      } else {
        Alert.alert('Procesamiento completado', response.message);
      }
    } catch (error) {
      console.error('Error al subir facturas:', error);
      Alert.alert('Error', 'Error al procesar las imágenes. Inténtalo de nuevo.');
    } finally {
      // ✅ LIMPIAR ARCHIVOS TEMPORALES
      await pdfService.cleanupTempFiles(tempFilesToCleanup);
      setIsLoading(false);
    }
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

  const getDisplayImage = (image) => {
    if (image.isMultiPage && image.pages && image.pages.length > 0) {
      return image.pages[0]; // Usar primera página como thumbnail
    }
    return image;
  };

  const getImageCountText = () => {
    const singleImages = capturedImages.filter(img => !img.isMultiPage).length;
    const multiPageGroups = capturedImages.filter(img => img.isMultiPage).length;
    const totalPages = capturedImages.reduce((total, img) => {
      if (img.isMultiPage && img.pages) {
        return total + img.pages.length;
      }
      return total + 1;
    }, 0);

    let text = `${totalPages} página(s)`;
    if (multiPageGroups > 0) {
      text += ` en ${singleImages + multiPageGroups} documento(s)`;
    }
    
    return text;
  };

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

  const currentImage = capturedImages[currentIndex];
  const displayImage = getDisplayImage(currentImage);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {getImageCountText()}
        </Text>
        {currentImage.isMultiPage && (
          <Text style={styles.multiPageInfo}>
            📄 Factura multipágina ({currentImage.pages.length} páginas)
          </Text>
        )}
      </View>

      <View style={styles.previewContainer}>
        <Image 
          source={{ uri: displayImage.uri }} 
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
                source={{ uri: getDisplayImage(image).uri }} 
                style={[
                  styles.thumbnail,
                  index === currentIndex && styles.thumbnailActive
                ]} 
              />
              {image.isMultiPage && (
                <View style={styles.multiPageBadge}>
                  <Text style={styles.multiPageBadgeText}>{image.pages.length}</Text>
                </View>
              )}
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
            <Text>Enviando imágenes...</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={handleSendAll}
            >
              <Ionicons name="send" size={20} color="white" />
              <Text style={styles.buttonText}>
                Enviar {getImageCountText()}
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

const styles = StyleSheet.create({
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
  multiPageInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
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
  multiPageBadge: {
    position: 'absolute',
    top: -5,
    left: -5,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  multiPageBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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
    backgroundColor: '#34C759',
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
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
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