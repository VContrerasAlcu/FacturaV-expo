// src/screens/CameraScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Camera } from 'expo-camera';
import { useAuth } from '../context/AuthContext.js';
import { Ionicons } from '@expo/vector-icons';

const CameraScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [isLoading, setIsLoading] = useState(false);
  const cameraRef = useRef(null);
  const { 
    signOut, 
    capturedImages, 
    addCapturedImage,
    isMultiPageMode,
    currentMultiPageGroup,
    startMultiPageCapture,
    completeMultiPageCapture,
    addPageToMultiPageGroup,
    cancelMultiPageCapture
  } = useAuth();
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        setIsLoading(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: false,
          skipProcessing: true
        });
        
        if (isMultiPageMode) {
          if (!currentMultiPageGroup) {
            console.warn('Modo multipágina activo pero no hay grupo definido');
            return;
          }
          
          // ✅ USAR LA NUEVA FUNCIÓN QUE RETORNA EL ESTADO ACTUALIZADO
          const result = await addPageToMultiPageGroup(photo);
          
          if (result.success) {
            console.log(`📄 Página ${result.pagesCount} agregada correctamente`);
            
            Alert.alert(
              'Página capturada',
              `Página ${result.pagesCount} de la factura multipágina.`,
              [
                { 
                  text: 'Agregar otra página', 
                  style: 'default' 
                },
                { 
                  text: 'Finalizar factura', 
                  style: 'default',
                  onPress: () => {
                    handleCompleteMultiPage(result.pagesCount);
                  }
                }
              ]
            );
          } else {
            Alert.alert('Error', 'No se pudo agregar la página a la factura multipágina');
          }
        } else {
          // Captura normal de una sola página
          addCapturedImage(photo);
          Alert.alert(
            'Imagen capturada',
            `Tienes ${capturedImages.length + 1} imagen(es) lista(s) para enviar.`,
            [
              { text: 'Seguir capturando', style: 'default' },
              { 
                text: 'Revisar y enviar', 
                style: 'default',
                onPress: () => navigation.navigate('Preview')
              }
            ]
          );
        }
      } catch (error) {
        console.error('Error en takePicture:', error);
        Alert.alert('Error', 'No se pudo capturar la imagen');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ✅ FUNCIÓN MEJORADA PARA FINALIZAR MULTIPÁGINA
  const handleCompleteMultiPage = (expectedPagesCount) => {
    if (!currentMultiPageGroup) {
      Alert.alert('Error', 'No hay factura multipágina activa');
      return;
    }

    console.log(`🎯 Finalizando factura multipágina. Esperadas: ${expectedPagesCount} páginas`);
    
    // Completar la captura multipágina
    const result = completeMultiPageCapture();
    
    if (result.success) {
      console.log(`✅ Factura multipágina completada con ${result.pagesCount} páginas`);
      
      setTimeout(() => {
        Alert.alert(
          '✅ Factura multipágina completada',
          `Se han capturado ${result.pagesCount} páginas correctamente. ¿Qué quieres hacer ahora?`,
          [
            { 
              text: 'Capturar otra factura', 
              style: 'cancel' 
            },
            { 
              text: 'Revisar y enviar', 
              style: 'default',
              onPress: () => {
                console.log('📋 Navegando al Preview');
                navigation.navigate('Preview');
              }
            }
          ]
        );
      }, 200);
    } else {
      Alert.alert('Error', 'No se pudo completar la factura multipágina');
    }
  };

  const handleGoToPreview = () => {
    // Si hay una factura multipágina en progreso, ofrecer finalizarla
    if (isMultiPageMode && currentMultiPageGroup && currentMultiPageGroup.pages && currentMultiPageGroup.pages.length > 0) {
      const pagesCount = currentMultiPageGroup.pages.length;
      Alert.alert(
        'Factura multipágina en progreso',
        `Tienes ${pagesCount} página(s) capturada(s) sin finalizar. ¿Quieres finalizar esta factura antes de revisar?`,
        [
          { 
            text: 'Continuar capturando', 
            style: 'cancel' 
          },
          { 
            text: 'Finalizar y revisar', 
            style: 'default',
            onPress: () => {
              handleCompleteMultiPage(pagesCount);
            }
          }
        ]
      );
    } else if (capturedImages.length === 0) {
      Alert.alert('Aviso', 'No hay imágenes capturadas');
    } else {
      navigation.navigate('Preview');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  const handleStartMultiPage = () => {
    Alert.alert(
      'Factura Multipágina',
      'Vas a capturar una factura con múltiples páginas. Después de cada página podrás elegir agregar más o finalizar la factura.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Comenzar', 
          style: 'default',
          onPress: () => {
            startMultiPageCapture();
            console.log('🚀 Iniciando captura multipágina');
          }
        }
      ]
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Solicitando permisos de cámara...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Se necesita permiso para usar la cámara</Text>
        <TouchableOpacity style={styles.button} onPress={handleSignOut}>
          <Text style={styles.buttonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        type={type}
        ref={cameraRef}
        onCameraReady={() => setIsCameraReady(true)}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.counterBadge} onPress={handleGoToPreview}>
            <Ionicons name="images" size={20} color="white" />
            <Text style={styles.counterText}>{capturedImages.length}</Text>
            {isMultiPageMode && currentMultiPageGroup && currentMultiPageGroup.pages && currentMultiPageGroup.pages.length > 0 && (
              <Text style={styles.counterSubText}>+{currentMultiPageGroup.pages.length} en progreso</Text>
            )}
          </TouchableOpacity>

          {isMultiPageMode && currentMultiPageGroup && (
            <View style={styles.multiPageBadge}>
              <Ionicons name="document" size={16} color="white" />
              <Text style={styles.multiPageText}>
                Multipágina: {currentMultiPageGroup?.pages?.length || 0} pág.
              </Text>
              <TouchableOpacity 
                style={styles.cancelMultiPage}
                onPress={() => {
                  Alert.alert(
                    'Cancelar captura multipágina',
                    '¿Estás seguro de que quieres cancelar esta factura multipágina? Se perderán todas las páginas capturadas.',
                    [
                      { text: 'Continuar', style: 'cancel' },
                      { 
                        text: 'Cancelar', 
                        style: 'destructive',
                        onPress: cancelMultiPageCapture
                      }
                    ]
                  );
                }}
              >
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={() => setType(
              type === Camera.Constants.Type.back
                ? Camera.Constants.Type.front
                : Camera.Constants.Type.back
            )}
          >
            <Text style={styles.flipText}>Voltear</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.captureButton, isLoading && styles.captureButtonDisabled]}
            onPress={takePicture}
            disabled={isLoading || !isCameraReady}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.previewButton, (capturedImages.length === 0 && (!isMultiPageMode || !currentMultiPageGroup || !currentMultiPageGroup.pages || currentMultiPageGroup.pages.length === 0)) && styles.previewButtonDisabled]}
            onPress={handleGoToPreview}
            disabled={capturedImages.length === 0 && (!isMultiPageMode || !currentMultiPageGroup || !currentMultiPageGroup.pages || currentMultiPageGroup.pages.length === 0)}
          >
            <Ionicons name="list" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {!isMultiPageMode && (
          <View style={styles.multiPageContainer}>
            <TouchableOpacity
              style={styles.multiPageButton}
              onPress={handleStartMultiPage}
            >
              <Ionicons name="documents" size={20} color="white" />
              <Text style={styles.multiPageButtonText}>Factura Multipágina</Text>
            </TouchableOpacity>
          </View>
        )}
      </Camera>
      
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>Salir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Los estilos se mantienen igual...
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    alignItems: 'flex-end',
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 20,
    marginBottom: 10,
  },
  counterText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: 'bold',
    fontSize: 16,
  },
  counterSubText: {
    color: '#4CAF50',
    marginLeft: 5,
    fontSize: 12,
    fontStyle: 'italic',
  },
  multiPageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,175,80,0.9)',
    padding: 10,
    borderRadius: 20,
  },
  multiPageText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelMultiPage: {
    marginLeft: 8,
    padding: 2,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  flipButton: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 50,
  },
  flipText: {
    fontSize: 18,
    color: 'white',
  },
  captureButton: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  captureButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  previewButton: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 50,
  },
  previewButtonDisabled: {
    opacity: 0.3,
  },
  multiPageContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  multiPageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76,175,80,0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  multiPageButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  signOutButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,0,0.7)',
    padding: 15,
    borderRadius: 8,
  },
  signOutText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#ff0000',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default CameraScreen;