// src/screens/CameraScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Camera } from 'expo-camera';
import { useAuth } from '../context/AuthContext.js';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

const CameraScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [isLoading, setIsLoading] = useState(false);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const [cameraRatio, setCameraRatio] = useState('16:9');
  const [showTipsOverlay, setShowTipsOverlay] = useState(false);
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
  
  const isFocused = useIsFocused();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (isFocused) {
      console.log('📷 CameraScreen enfocada - reiniciando cámara');
      setIsCameraReady(false);
      setShowTipsOverlay(false);
    }
  }, [isFocused]);

  // En CameraScreen.js - MODIFICAR la función takePicture

  const takePicture = async () => {
    if (cameraRef.current && isCameraReady && isFocused) {
      try {
        setIsLoading(true);
        
        // ✅ CAPTURA CON CALIDAD REDUCIDA
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.6, // ✅ REDUCIDO de 0.9 a 0.6 (33% menos calidad)
          base64: false,
          skipProcessing: false, // Mantener procesamiento básico
          exif: true,
          // ✅ AGREGAR: Configuración específica para reducir tamaño
          // width: 1024,  // Opcional: limitar ancho máximo
          // height: 1024, // Opcional: limitar alto máximo
        });
        
        console.log('📸 Foto capturada con calidad optimizada');
        
        if (isMultiPageMode) {
          if (!currentMultiPageGroup) {
            console.warn('Modo multipágina activo pero no hay grupo definido');
            return;
          }
          
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
        Alert.alert('Error', 'No se pudo capturar la imagen. La cámara puede no estar lista.');
      } finally {
        setIsLoading(false);
      }
    } else {
      let errorMessage = 'La cámara no está lista';
      if (!isFocused) errorMessage = 'La pantalla de cámara no está activa';
      if (!isCameraReady) errorMessage = 'La cámara se está inicializando';
      if (!cameraRef.current) errorMessage = 'La cámara no está disponible';
      
      console.warn(`❌ No se puede capturar: ${errorMessage}`);
      Alert.alert('Cámara no disponible', errorMessage);
    }
  };

  const toggleFlash = () => {
    setFlashMode(
      flashMode === Camera.Constants.FlashMode.off
        ? Camera.Constants.FlashMode.on
        : Camera.Constants.FlashMode.off
    );
  };

  const toggleTipsOverlay = () => {
    setShowTipsOverlay(!showTipsOverlay);
  };

  const handleCompleteMultiPage = (expectedPagesCount) => {
    if (!currentMultiPageGroup) {
      Alert.alert('Error', 'No hay factura multipágina activa');
      return;
    }

    console.log(`🎯 Finalizando factura multipágina. Esperadas: ${expectedPagesCount} páginas`);
    
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
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Solicitando permisos de cámara...</Text>
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
      {isFocused ? (
        <Camera
          style={styles.camera}
          type={type}
          ref={cameraRef}
          onCameraReady={() => {
            console.log('✅ Cámara lista y configurada');
            setIsCameraReady(true);
          }}
          autoFocus={Camera.Constants.AutoFocus.on}
          flashMode={flashMode}
          whiteBalance={Camera.Constants.WhiteBalance.auto}
          ratio={cameraRatio}
          onMountError={(error) => {
            console.error('❌ Error montando cámara:', error);
            Alert.alert('Error', 'No se pudo inicializar la cámara');
          }}
        >
          {/* ✅ ELEMENTOS INTERACTIVOS CON zIndex ALTO (POR ENCIMA DEL OVERLAY) */}
          
          {/* HEADER - POR ENCIMA DE TODO */}
          <View style={[styles.header, { zIndex: 100 }]}>
            <TouchableOpacity style={styles.counterBadge} onPress={handleGoToPreview}>
              <Ionicons name="images" size={20} color="white" />
              <Text style={styles.counterText}>{capturedImages.length}</Text>
              {isMultiPageMode && currentMultiPageGroup && currentMultiPageGroup.pages && currentMultiPageGroup.pages.length > 0 && (
                <Text style={styles.counterSubText}>+{currentMultiPageGroup.pages.length} en progreso</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
              <Ionicons 
                name={flashMode === Camera.Constants.FlashMode.on ? "flash" : "flash-off"} 
                size={24} 
                color="white" 
              />
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

          {/* BOTONES PRINCIPALES - POR ENCIMA DE TODO */}
          <View style={[styles.buttonContainer, { zIndex: 100 }]}>
            <TouchableOpacity
              style={styles.tipsButton}
              onPress={toggleTipsOverlay}
            >
              <Ionicons 
                name={showTipsOverlay ? "eye-off" : "help-circle"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() => setType(
                type === Camera.Constants.Type.back
                  ? Camera.Constants.Type.front
                  : Camera.Constants.Type.back
              )}
            >
              <Ionicons name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.captureButton, (isLoading || !isCameraReady) && styles.captureButtonDisabled]}
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

          {/* BOTÓN MULTIPÁGINA - POR ENCIMA DE TODO */}
          {!isMultiPageMode && (
            <View style={[styles.multiPageContainer, { zIndex: 100 }]}>
              <TouchableOpacity
                style={styles.multiPageButton}
                onPress={handleStartMultiPage}
              >
                <Ionicons name="documents" size={20} color="white" />
                <Text style={styles.multiPageButtonText}>Factura Multipágina</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ✅ OVERLAY DE GUÍAS - CON zIndex BAJO (DEBAJO DE LOS BOTONES) */}
          <View style={[styles.guideOverlay, { zIndex: 10 }]}>
            <View style={styles.guideFrame}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </View>
          </View>

          {/* ✅ CONSEJOS - CON zIndex MEDIO (POR ENCIMA DE GUÍAS, DEBAJO DE BOTONES) */}
          {showTipsOverlay && (
            <View style={[styles.instructionsContainer, { zIndex: 50 }]}>
              <TouchableOpacity 
                style={styles.closeTipsButton}
                onPress={toggleTipsOverlay}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.instructionsTitle}>📸 Consejos para mejor calidad:</Text>
              <Text style={styles.instructionsText}>• Mantén el dispositivo estable</Text>
              <Text style={styles.instructionsText}>• Buena iluminación natural</Text>
              <Text style={styles.instructionsText}>• Encuadra toda la factura</Text>
              <Text style={styles.instructionsText}>• Evita sombras y reflejos</Text>
              <TouchableOpacity 
                style={styles.moreTipsButton}
                onPress={() => {
                  setShowTipsOverlay(false);
                  navigation.navigate('ImageTips');
                }}
              >
                <Text style={styles.moreTipsText}>Ver más consejos →</Text>
              </TouchableOpacity>
            </View>
          )}
        </Camera>
      ) : (
        <View style={styles.cameraPlaceholder}>
          <Ionicons name="camera" size={80} color="#007AFF" />
          <Text style={styles.placeholderText}>Cargando cámara...</Text>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
      
      <View style={[styles.bottomContainer, { zIndex: 100 }]}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out" size={20} color="white" />
          <Text style={styles.signOutText}>Salir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  // ✅ ESTILOS PARA GUÍAS - SIN pointerEvents PARA NO BLOQUEAR TOUCH
  guideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    pointerEvents: 'none', // ✅ IMPORTANTE: NO INTERCEPTA TOUCHES
  },
  guideFrame: {
    width: '80%',
    height: '60%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'transparent',
    pointerEvents: 'none', // ✅ NO INTERCEPTA TOUCHES
  },
  cornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 20,
    height: 20,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: '#00FF00',
    pointerEvents: 'none', // ✅ NO INTERCEPTA TOUCHES
  },
  cornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderColor: '#00FF00',
    pointerEvents: 'none',
  },
  cornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 20,
    height: 20,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#00FF00',
    pointerEvents: 'none',
  },
  cornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: '#00FF00',
    pointerEvents: 'none',
  },
  // ✅ CONSEJOS - CON pointerEvents: 'auto' PARA SER INTERACTIVOS
  instructionsContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#007AFF',
    pointerEvents: 'auto', // ✅ PERMITE INTERACCIÓN
  },
  closeTipsButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  instructionsTitle: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  instructionsText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
    lineHeight: 18,
  },
  moreTipsButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
    borderRadius: 8,
    alignItems: 'center',
  },
  moreTipsText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: 'white',
    fontSize: 18,
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // ✅ ELEMENTOS INTERACTIVOS - CON pointerEvents: 'auto' (POR DEFECTO)
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    pointerEvents: 'auto',
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 20,
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
  flashButton: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 20,
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
    pointerEvents: 'auto',
  },
  tipsButton: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 50,
  },
  flipButton: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 50,
  },
  captureButton: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 3,
    borderColor: 'white',
  },
  captureButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.3)',
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
    pointerEvents: 'auto',
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
    pointerEvents: 'auto',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,0,0,0.7)',
    padding: 15,
    borderRadius: 8,
  },
  signOutText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
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