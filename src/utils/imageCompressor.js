// src/utils/imageCompressor.js
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export const compressImage = async (imageUri, maxSizeMB = 3) => {
  try {
    // Obtener información de la imagen
    const imageInfo = await FileSystem.getInfoAsync(imageUri);
    const sizeMB = imageInfo.size / 1024 / 1024;
    
    // Si la imagen es menor que el tamaño máximo, no comprimir
    if (sizeMB <= maxSizeMB) {
      return imageUri;
    }
    
    // Calcular factor de compresión (máximo 70% de calidad)
    const compressionRatio = Math.min(0.7, maxSizeMB / sizeMB);
    const quality = Math.floor(compressionRatio * 100);
    
    console.log(`Comprimiendo imagen de ${sizeMB.toFixed(2)}MB a calidad ${quality}%`);
    
    // Comprimir imagen
    const compressedImage = await manipulateAsync(
      imageUri,
      [{ resize: { width: 1024 } }], // Redimensionar ancho máximo 1024px
      { compress: quality / 100, format: SaveFormat.JPEG }
    );
    
    const compressedInfo = await FileSystem.getInfoAsync(compressedImage.uri);
    console.log(`Imagen comprimida: ${compressedInfo.size / 1024 / 1024}MB`);
    
    return compressedImage.uri;
  } catch (error) {
    console.error('Error comprimiendo imagen:', error);
    return imageUri; // Devolver original en caso de error
  }
};