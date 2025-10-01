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
          // Agregar página al grupo multipágina
          addPageToMultiPageGroup(photo);
          Alert.alert(
            'Página agregada',
            `Página ${currentMultiPageGroup.pages.length + 1} capturada. ¿Continuar con más páginas?`,
            [
              { 
                text: 'Agregar otra página', 
                style: 'default' 
              },
              { 
                text: 'Finalizar factura', 
                style: 'default',
                onPress: completeMultiPageCapture
              }
            ]
          );
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
        Alert.alert('Error', 'No se pudo capturar la imagen');
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
      Alert.alert('Aviso', 'No hay imágenes capturadas');
      return;
    }
    navigation.navigate('Preview');
  };

  const handleStartMultiPage = () => {
    Alert.alert(
      'Factura Multipágina',
      'Vas a capturar una factura con múltiples páginas. Captura todas las páginas en orden.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Comenzar', 
          style: 'default',
          onPress: startMultiPageCapture
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
        {/* Header con información del estado */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.counterBadge} onPress={goToPreview}>
            <Ionicons name="images" size={20} color="white" />
            <Text style={styles.counterText}>{capturedImages.length}</Text>
          </TouchableOpacity>

          {/* Indicador de modo multipágina */}
          {isMultiPageMode && (
            <View style={styles.multiPageBadge}>
              <Ionicons name="document" size={16} color="white" />
              <Text style={styles.multiPageText}>
                Multipágina: {currentMultiPageGroup.pages.length} pág.
              </Text>
              <TouchableOpacity 
                style={styles.cancelMultiPage}
                onPress={cancelMultiPageCapture}
              >
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          )}
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
            <Text style={styles.flipText}>Voltear</Text>
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
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>
          
          {/* Botón de vista previa */}
          <TouchableOpacity
            style={styles.previewButton}
            onPress={goToPreview}
            disabled={capturedImages.length === 0}
          >
            <Ionicons name="list" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Botón para modo multipágina */}
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
  counterText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: 'bold',
    fontSize: 16,
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