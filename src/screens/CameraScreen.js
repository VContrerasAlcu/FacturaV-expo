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
  const { signOut, capturedImages, addCapturedImage } = useAuth();
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
        
        // Agregar la imagen al contexto en lugar de navegar directamente
        addCapturedImage(photo);
        
        // Mostrar feedback al usuario
        Alert.alert(
          '✅ Imagen capturada',
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
      } catch (error) {
        Alert.alert('❌ Error', 'No se pudo capturar la imagen');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  const goToPreview = () => {
    if (capturedImages.length === 0) {
      Alert.alert('ℹ️ Aviso', 'No hay imágenes capturadas');
      return;
    }
    navigation.navigate('Preview');
  };

  // 🆕 Función para sugerir multipágina si hay muchas imágenes
  const getMultipageHint = () => {
    if (capturedImages.length >= 3) {
      return '📑 Puede ser multipágina';
    }
    return '';
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
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-off" size={80} color="#ff3b30" />
        <Text style={styles.errorText}>Se necesita permiso para usar la cámara</Text>
        <Text style={styles.errorSubtext}>
          Por favor, permite el acceso a la cámara en la configuración de tu dispositivo
        </Text>
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
          <TouchableOpacity style={styles.counterBadge} onPress={goToPreview}>
            <Ionicons name="images" size={20} color="white" />
            <Text style={styles.counterText}>{capturedImages.length}</Text>
            {/* 🆕 Indicador de multipágina */}
            {capturedImages.length > 0 && (
              <Text style={styles.multipageHint}>
                {getMultipageHint()}
              </Text>
            )}
          </TouchableOpacity>
          
          {/* 🆕 Información sobre multipágina */}
          {capturedImages.length >= 2 && (
            <View style={styles.multipageInfo}>
              <Text style={styles.multipageInfoText}>
                💡 El sistema detectará automáticamente facturas multipágina
              </Text>
            </View>
          )}
        </View>

        {/* Guías de captura */}
        <View style={styles.captureGuide}>
          <View style={styles.guideFrame}>
            <View style={styles.guideCornerTopLeft} />
            <View style={styles.guideCornerTopRight} />
            <View style={styles.guideCornerBottomLeft} />
            <View style={styles.guideCornerBottomRight} />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {/* Botón para voltear cámara */}
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
          
          {/* Botón de captura principal */}
          <TouchableOpacity
            style={[styles.captureButton, isLoading && styles.captureButtonDisabled]}
            onPress={takePicture}
            disabled={isLoading || !isCameraReady}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.captureInner}>
                <View style={styles.captureInnerCircle} />
              </View>
            )}
          </TouchableOpacity>
          
          {/* Botón para ir a preview */}
          <TouchableOpacity
            style={[styles.previewButton, capturedImages.length === 0 && styles.previewButtonDisabled]}
            onPress={goToPreview}
            disabled={capturedImages.length === 0}
          >
            <Ionicons name="list" size={24} color="white" />
            {capturedImages.length > 0 && (
              <View style={styles.previewBadge}>
                <Text style={styles.previewBadgeText}>{capturedImages.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Camera>
      
      {/* Panel inferior con información y acciones */}
      <View style={styles.bottomContainer}>
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Captura de Facturas</Text>
          <Text style={styles.infoText}>
            {capturedImages.length === 0 
              ? 'Toma fotos de tus facturas una por una'
              : `Tienes ${capturedImages.length} imagen(es) capturada(s)`
            }
          </Text>
          
          {/* 🆕 Información sobre límites */}
          {capturedImages.length > 0 && (
            <View style={styles.limitsInfo}>
              <Text style={styles.limitsText}>
                📝 Límites: 
                {capturedImages.length >= 10 && ' ⚠️ Máximo 10 archivos normales'}
                {capturedImages.length >= 20 && ' 🚫 Máximo 20 archivos multipágina'}
              </Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out" size={20} color="white" />
          <Text style={styles.signOutText}>Cerrar Sesión</Text>
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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 10,
    color: '#ff3b30',
    fontWeight: 'bold',
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    lineHeight: 20,
  },
  camera: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    justifyContent: 'center',
  },
  counterText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  multipageHint: {
    marginLeft: 8,
    fontSize: 12,
    color: '#FFD700',
  },
  multipageInfo: {
    backgroundColor: 'rgba(0,122,255,0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    maxWidth: '70%',
  },
  multipageInfoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  captureGuide: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    width: '80%',
    height: '60%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    position: 'relative',
  },
  guideCornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: 'white',
  },
  guideCornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: 'white',
  },
  guideCornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: 'white',
  },
  guideCornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: 'white',
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  flipButton: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  captureButton: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  captureButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  captureInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  previewButton: {
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 50,
    height: 50,
    borderRadius: 25,
    position: 'relative',
  },
  previewButtonDisabled: {
    opacity: 0.3,
  },
  previewBadge: {
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
  previewBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bottomContainer: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  infoSection: {
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 10,
  },
  limitsInfo: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  limitsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,59,48,0.8)',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  signOutText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 150,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CameraScreen;