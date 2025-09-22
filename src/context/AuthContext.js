// src/context/AuthContext.js
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = React.createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [capturedImages, setCapturedImages] = React.useState([]);

  const signIn = async (token) => {
    try {
      await AsyncStorage.setItem('token', token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('token');
      setIsAuthenticated(false);
      setCapturedImages([]); // Limpiar imágenes al cerrar sesión
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const addCapturedImage = (image) => {
    setCapturedImages(prev => [...prev, {
      ...image,
      id: Date.now().toString(), // ID único para cada imagen
      timestamp: new Date().toISOString()
    }]);
  };

  const removeCapturedImage = (imageId) => {
    setCapturedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const clearCapturedImages = () => {
    setCapturedImages([]);
  };

  React.useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error('Error checking token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      signIn,
      signOut,
      capturedImages,
      addCapturedImage,
      removeCapturedImage,
      clearCapturedImages
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);