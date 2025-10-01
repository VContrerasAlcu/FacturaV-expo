// src/context/AuthContext.js
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = React.createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [capturedImages, setCapturedImages] = React.useState([]);
  const [isMultiPageMode, setIsMultiPageMode] = React.useState(false);
  const [currentMultiPageGroup, setCurrentMultiPageGroup] = React.useState([]);

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
      setCapturedImages([]);
      setIsMultiPageMode(false);
      setCurrentMultiPageGroup([]);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const addCapturedImage = (image) => {
    setCapturedImages(prev => [...prev, {
      ...image,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      isMultiPage: isMultiPageMode,
      groupId: isMultiPageMode ? currentMultiPageGroup.id : null
    }]);
  };

  const removeCapturedImage = (imageId) => {
    setCapturedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const clearCapturedImages = () => {
    setCapturedImages([]);
    setCurrentMultiPageGroup([]);
  };

  const startMultiPageCapture = () => {
    const groupId = Date.now().toString();
    setCurrentMultiPageGroup({
      id: groupId,
      pages: [],
      isComplete: false
    });
    setIsMultiPageMode(true);
  };

  const completeMultiPageCapture = () => {
    if (currentMultiPageGroup.pages.length > 0) {
      setCapturedImages(prev => [...prev, {
        id: currentMultiPageGroup.id,
        uri: currentMultiPageGroup.pages[0].uri, // Usar primera página como thumbnail
        timestamp: new Date().toISOString(),
        isMultiPage: true,
        groupId: currentMultiPageGroup.id,
        pages: [...currentMultiPageGroup.pages],
        type: 'multi-page'
      }]);
    }
    setCurrentMultiPageGroup([]);
    setIsMultiPageMode(false);
  };

  const addPageToMultiPageGroup = (image) => {
    setCurrentMultiPageGroup(prev => ({
      ...prev,
      pages: [...prev.pages, {
        ...image,
        pageNumber: prev.pages.length + 1
      }]
    }));
  };

  const cancelMultiPageCapture = () => {
    setCurrentMultiPageGroup([]);
    setIsMultiPageMode(false);
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
      clearCapturedImages,
      isMultiPageMode,
      currentMultiPageGroup,
      startMultiPageCapture,
      completeMultiPageCapture,
      addPageToMultiPageGroup,
      cancelMultiPageCapture
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);