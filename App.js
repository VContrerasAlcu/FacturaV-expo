import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { registerRootComponent } from 'expo';
import { AuthProvider, useAuth } from './src/context/AuthContext.js';

// Importar tus pantallas
import LoginScreen from './src/screens/LoginScreen.js';
import RegisterScreen from './src/screens/RegisterScreen.js';
import CameraScreen from './src/screens/CameraScreen.js';
import PreviewScreen from './src/screens/PreviewScreen.js';

const Stack = createNativeStackNavigator();

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const safeAreaInsets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Camera" component={CameraScreen} />
            <Stack.Screen name="Preview" component={PreviewScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
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
  },
});

export default registerRootComponent(App);