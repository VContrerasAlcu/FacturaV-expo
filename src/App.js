import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importar tus pantallas
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import CameraScreen from './src/screens/CameraScreen';
import PreviewScreen from './src/screens/PreviewScreen';

// Importar servicios de autenticación
import { authService } from './src/services/auth';

// Crear el navigator
const Stack = createStackNavigator();

// Crear un contexto para la autenticación
const AuthContext = React.createContext({
  signIn: () => {},
  signOut: () => {},
  isLoading: true,
  isAuthenticated: false,
});

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.token,
            isLoading: false,
            isAuthenticated: !!action.token,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isAuthenticated: true,
            userToken: action.token,
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            isAuthenticated: false,
            userToken: null,
          };
        default:
          return prevState;
      }
    },
    {
      isLoading: true,
      isAuthenticated: false,
      userToken: null,
    }
  );

  useEffect(() => {
    // Buscar el token al iniciar la app
    const bootstrapAsync = async () => {
      let userToken;

      try {
        userToken = await AsyncStorage.getItem('token');
      } catch (e) {
        console.error('Error restoring token', e);
      }

      dispatch({ type: 'RESTORE_TOKEN', token: userToken });
    };

    bootstrapAsync();
  }, []);

  const authContext = React.useMemo(
    () => ({
      signIn: async (token) => {
        await AsyncStorage.setItem('token', token);
        dispatch({ type: 'SIGN_IN', token });
      },
      signOut: async () => {
        await AsyncStorage.removeItem('token');
        dispatch({ type: 'SIGN_OUT' });
      },
      isLoading: state.isLoading,
      isAuthenticated: state.isAuthenticated,
    }),
    [state.isLoading, state.isAuthenticated]
  );

  if (state.isLoading) {
    return (
      <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <Stack.Navigator>
          {state.isAuthenticated ? (
            <>
              <Stack.Screen 
                name="Camera" 
                options={{ headerShown: false }}
              >
                {(props) => <CameraScreen {...props} signOut={authContext.signOut} />}
              </Stack.Screen>
              <Stack.Screen 
                name="Preview" 
                component={PreviewScreen} 
                options={{ headerShown: false }}
              />
            </>
          ) : (
            <>
              <Stack.Screen 
                name="Login" 
                options={{ headerShown: false }}
              >
                {(props) => <LoginScreen {...props} signIn={authContext.signIn} />}
              </Stack.Screen>
              <Stack.Screen 
                name="Register" 
                options={{ headerShown: false }}
              >
                {(props) => <RegisterScreen {...props} signIn={authContext.signIn} />}
              </Stack.Screen>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});