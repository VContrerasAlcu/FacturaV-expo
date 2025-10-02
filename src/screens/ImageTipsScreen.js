// src/screens/ImageTipsScreen.js
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ImageTipsScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📸 Consejos para Mejor Calidad</Text>
      
      <View style={styles.tipCard}>
        <Ionicons name="sunny" size={24} color="#FFA500" />
        <Text style={styles.tipTitle}>Iluminación</Text>
        <Text style={styles.tipText}>
          • Usa luz natural siempre que sea posible{"\n"}
          • Evita sombras sobre la factura{"\n"}
          • No uses flash directo (crea reflejos){"\n"}
          • Iluminación uniforme en toda la factura
        </Text>
      </View>

      <View style={styles.tipCard}>
        <Ionicons name="camera" size={24} color="#007AFF" />
        <Text style={styles.tipTitle}>Encuadre</Text>
        <Text style={styles.tipText}>
          • Mantén la cámara paralela a la factura{"\n"}
          • Asegúrate de que toda la factura esté visible{"\n"}
          • Usa las guías de la cámara para alinear{"\n"}
          • Deja margen alrededor de la factura
        </Text>
      </View>

      <View style={styles.tipCard}>
        <Ionicons name="hand-right" size={24} color="#34C759" />
        <Text style={styles.tipTitle}>Estabilidad</Text>
        <Text style={styles.tipText}>
          • Apoya el brazo o el codo en una superficie{"\n"}
          • Mantén el dispositivo estable{"\n"}
          • Espera a que se enfoque antes de capturar{"\n"}
          • Respira suavemente al tomar la foto
        </Text>
      </View>

      <View style={styles.tipCard}>
        <Ionicons name="document-text" size={24} color="#FF3B30" />
        <Text style={styles.tipTitle}>Calidad del Documento</Text>
        <Text style={styles.tipText}>
          • Facturas nítidas y sin arrugas{"\n"}
          • Texto claro y legible{"\n"}
          • Formato estándar (mejor reconocimiento){"\n"}
          • Sin reflejos ni brillos
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  tipCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 8,
    color: '#333',
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default ImageTipsScreen;