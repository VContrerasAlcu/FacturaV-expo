// src/utils/imageCompressor.js - CREAR ESTE ARCHIVO
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/**
 * Comprime una imagen individual para reducir su tamaño
 */
export const compressImageForUpload = async (imageUri, maxSizeKB = 300) => {
  try {
    console.log(`🔄 Comprimiendo imagen: ${imageUri}`);
    
    // Primera compresión: reducir calidad
    const compressedImage = await manipulateAsync(
      imageUri,
      [],
      { 
        compress: 0.6, // ✅ 60% de calidad
        format: SaveFormat.JPEG 
      }
    );
    
    // Verificar tamaño
    const response = await fetch(compressedImage.uri);
    const blob = await response.blob();
    const sizeKB = blob.size / 1024;
    
    console.log(`📊 Tamaño después de compresión 1: ${sizeKB.toFixed(1)}KB`);
    
    // Si todavía es muy grande, aplicar compresión más agresiva
    if (sizeKB > maxSizeKB) {
      console.log('🔁 Aplicando compresión adicional...');
      
      const furtherCompressed = await manipulateAsync(
        compressedImage.uri,
        [{ resize: { width: 1024 } }], // ✅ Reducir dimensiones
        { 
          compress: 0.5, // ✅ 50% de calidad
          format: SaveFormat.JPEG 
        }
      );
      
      const response2 = await fetch(furtherCompressed.uri);
      const blob2 = await response2.blob();
      const finalSizeKB = blob2.size / 1024;
      
      console.log(`✅ Compresión final: ${finalSizeKB.toFixed(1)}KB`);
      return furtherCompressed.uri;
    }
    
    console.log(`✅ Compresión suficiente: ${sizeKB.toFixed(1)}KB`);
    return compressedImage.uri;
    
  } catch (error) {
    console.error('❌ Error comprimiendo imagen:', error);
    return imageUri; // Devolver original en caso de error
  }
};

/**
 * Comprime todas las imágenes de un array
 */
export const compressAllImages = async (images) => {
  console.log(`🔄 Comprimiendo ${images.length} imágenes...`);
  
  const compressedImages = [];
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    console.log(`📸 Comprimiendo imagen ${i + 1}/${images.length}`);
    
    try {
      const compressedUri = await compressImageForUpload(image.uri);
      compressedImages.push({
        ...image,
        uri: compressedUri,
        compressed: true
      });
    } catch (error) {
      console.error(`❌ Error comprimiendo imagen ${i + 1}:`, error);
      // Si falla la compresión, mantener la imagen original
      compressedImages.push(image);
    }
  }
  
  console.log(`✅ Todas las imágenes comprimidas`);
  return compressedImages;
};

/**
 * Comprimir una sola imagen (para uso individual)
 */
export const compressSingleImage = async (imageUri) => {
  return await compressImageForUpload(imageUri);
};