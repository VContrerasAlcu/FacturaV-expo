// App.js - VERSIÓN COMPLETA MODIFICADA (sin Google Auth, con recuperación de contraseña)
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo';
import { AuthProvider, useAuth } from './src/context/AuthContext.js';
import ImageTipsScreen from './src/screens/ImageTipsScreen.js';

// Importar pantallas
import LoginScreen from './src/screens/LoginScreen.js';
import RegisterScreen from './src/screens/RegisterScreen.js';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen.js'; // ✅ NUEVO
import CameraScreen from './src/screens/CameraScreen.js';
import PreviewScreen from './src/screens/PreviewScreen.js';

const Stack = createNativeStackNavigator();

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const safeAreaInsets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          animation: 'slide_from_right'
        }}
      >
        {isAuthenticated ? (
          // ✅ USUARIO AUTENTICADO - Pantallas principales de la app
          <>
            <Stack.Screen 
              name="Camera" 
              component={CameraScreen}
              options={{
                animation: 'fade'
              }}
            />
            <Stack.Screen 
              name="Preview" 
              component={PreviewScreen}
              options={{
                presentation: 'card',
                animation: 'slide_from_bottom'
              }}
            />
            <Stack.Screen 
              name="ImageTips" 
              component={ImageTipsScreen}
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom'
              }}
            />
          </>
        ) : (
          // ✅ USUARIO NO AUTENTICADO - Pantallas de autenticación
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{
                animation: 'fade'
              }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{
                animation: 'slide_from_right'
              }}
            />
            <Stack.Screen 
              name="ForgotPassword" 
              component={ForgotPasswordScreen}
              options={{
                title: 'Recuperar Contraseña',
                headerShown: true,
                headerStyle: {
                  backgroundColor: '#007AFF',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
                animation: 'slide_from_right'
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default registerRootComponent(App);