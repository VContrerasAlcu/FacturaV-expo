// src/context/AuthContext.js
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = React.createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [capturedImages, setCapturedImages] = React.useState([]);
  const [isMultiPageMode, setIsMultiPageMode] = React.useState(false);
  const [currentMultiPageGroup, setCurrentMultiPageGroup] = React.useState(null);
  
  // ✅ NUEVO: Referencia para el estado actual
  const currentMultiPageGroupRef = React.useRef(null);

  // ✅ ACTUALIZAR LA REFERENCIA CUANDO CAMBIA EL ESTADO
  React.useEffect(() => {
    currentMultiPageGroupRef.current = currentMultiPageGroup;
  }, [currentMultiPageGroup]);

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
      setCurrentMultiPageGroup(null);
      currentMultiPageGroupRef.current = null;
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
      groupId: isMultiPageMode && currentMultiPageGroup ? currentMultiPageGroup.id : null
    }]);
  };

  const removeCapturedImage = (imageId) => {
    setCapturedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const clearCapturedImages = () => {
    setCapturedImages([]);
    setCurrentMultiPageGroup(null);
    currentMultiPageGroupRef.current = null;
  };

  const startMultiPageCapture = () => {
    const groupId = Date.now().toString();
    const newGroup = {
      id: groupId,
      pages: [],
      isComplete: false
    };
    setCurrentMultiPageGroup(newGroup);
    currentMultiPageGroupRef.current = newGroup;
    setIsMultiPageMode(true);
    return groupId;
  };

  // ✅ FUNCIÓN COMPLETAMENTE CORREGIDA
  const completeMultiPageCapture = () => {
    // ✅ USAR LA REFERENCIA EN LUGAR DEL ESTADO (más confiable)
    const group = currentMultiPageGroupRef.current;
    
    if (!group) {
      console.warn('No hay grupo multipágina activo');
      setIsMultiPageMode(false);
      return { success: false, pagesCount: 0 };
    }

    const pagesCount = group.pages ? group.pages.length : 0;
    console.log(`🔍 completeMultiPageCapture: Grupo con ${pagesCount} páginas`);
    
    if (pagesCount > 0) {
      // ✅ CREAR LA FACTURA MULTIPÁGINA CON TODAS LAS PÁGINAS
      const multiPageInvoice = {
        id: group.id,
        uri: group.pages[0].uri, // Primera página como thumbnail
        timestamp: new Date().toISOString(),
        isMultiPage: true,
        groupId: group.id,
        pages: [...group.pages], // ✅ COPIA DE TODAS LAS PÁGINAS
        type: 'multi-page',
        pagesCount: pagesCount
      };
      
      console.log(`✅ Agregando factura multipágina con ${pagesCount} páginas:`, 
        multiPageInvoice.pages.map(p => p.pageNumber));
      
      // ✅ AGREGAR AL ESTADO
      setCapturedImages(prev => [...prev, multiPageInvoice]);
    }
    
    // ✅ LIMPIAR ESTADO
    setCurrentMultiPageGroup(null);
    currentMultiPageGroupRef.current = null;
    setIsMultiPageMode(false);
    
    return { success: pagesCount > 0, pagesCount };
  };

  // ✅ FUNCIÓN MEJORADA PARA AGREGAR PÁGINAS
  const addPageToMultiPageGroup = (image) => {
    return new Promise((resolve) => {
      setCurrentMultiPageGroup(prev => {
        if (!prev) {
          resolve({ success: false, pagesCount: 0 });
          return prev;
        }
        
        const newPage = {
          ...image,
          pageNumber: (prev.pages ? prev.pages.length : 0) + 1,
          id: `${prev.id}_page_${(prev.pages ? prev.pages.length : 0) + 1}`,
          timestamp: new Date().toISOString()
        };
        
        const newPages = [...(prev.pages || []), newPage];
        const newState = {
          ...prev,
          pages: newPages
        };
        
        console.log(`📄 Página ${newPage.pageNumber} agregada. Total: ${newPages.length}`);
        
        // ✅ ACTUALIZAR LA REFERENCIA TAMBIÉN
        currentMultiPageGroupRef.current = newState;
        
        // ✅ RESOLVER CON EL NÚMERO CORRECTO
        resolve({ 
          success: true, 
          pagesCount: newPages.length,
          pageNumber: newPage.pageNumber
        });
        
        return newState;
      });
    });
  };

  const cancelMultiPageCapture = () => {
    if (currentMultiPageGroupRef.current) {
      const pagesCount = currentMultiPageGroupRef.current.pages ? currentMultiPageGroupRef.current.pages.length : 0;
      console.log(`❌ Cancelada factura multipágina con ${pagesCount} páginas`);
    }
    setCurrentMultiPageGroup(null);
    currentMultiPageGroupRef.current = null;
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