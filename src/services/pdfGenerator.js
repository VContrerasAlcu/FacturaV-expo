// src/services/pdfGenerator.js
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export const pdfService = {
  // ✅ CONVERTIR IMAGEN ÚNICA A PDF
  convertImageToPDF: async (imageUri, filename = 'factura.pdf') => {
    try {
      console.log(`📄 Convirtiendo imagen a PDF: ${filename}`);
      
      // Crear HTML simple con la imagen
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { 
                margin: 0; 
                padding: 0; 
                display: flex; 
                justify-content: center; 
                align-items: center;
                min-height: 100vh;
              }
              img { 
                max-width: 100%; 
                max-height: 100vh; 
                object-fit: contain; 
              }
            </style>
          </head>
          <body>
            <img src="${imageUri}" />
          </body>
        </html>
      `;

      // Generar PDF
      const { uri: pdfUri } = await Print.printToFileAsync({
        html,
        base64: false
      });

      console.log(`✅ PDF generado: ${pdfUri}`);
      return {
        uri: pdfUri,
        name: filename,
        type: 'application/pdf'
      };
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      throw error;
    }
  },

  // ✅ CONVERTIR MÚLTIPLES IMÁGENES A UN SOLO PDF
  convertImagesToMultiPagePDF: async (images, filename = 'factura_multipagina.pdf') => {
    try {
      console.log(`📄 Convirtiendo ${images.length} imágenes a PDF multipágina: ${filename}`);
      
      // Crear HTML con todas las imágenes (cada una en su página)
      let html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { 
                margin: 0; 
                padding: 0; 
              }
              .page { 
                page-break-after: always; 
                display: flex; 
                justify-content: center; 
                align-items: center;
                min-height: 100vh;
              }
              .page:last-child { 
                page-break-after: auto; 
              }
              img { 
                max-width: 100%; 
                max-height: 95vh; 
                object-fit: contain; 
              }
            </style>
          </head>
          <body>
      `;

      // Agregar cada imagen como una página
      images.forEach((image, index) => {
        html += `
          <div class="page">
            <img src="${image.uri}" alt="Página ${index + 1}" />
          </div>
        `;
      });

      html += `</body></html>`;

      // Generar PDF
      const { uri: pdfUri } = await Print.printToFileAsync({
        html,
        base64: false
      });

      console.log(`✅ PDF multipágina generado: ${pdfUri} con ${images.length} páginas`);
      return {
        uri: pdfUri,
        name: filename,
        type: 'application/pdf',
        pageCount: images.length
      };
    } catch (error) {
      console.error('❌ Error generando PDF multipágina:', error);
      throw error;
    }
  },

  // ✅ LIMPIAR ARCHIVOS TEMPORALES
  cleanupTempFiles: async (fileUris) => {
    try {
      for (const uri of fileUris) {
        try {
          await FileSystem.deleteAsync(uri);
          console.log(`🧹 Archivo temporal eliminado: ${uri}`);
        } catch (error) {
          console.warn(`⚠️ No se pudo eliminar archivo temporal: ${uri}`, error);
        }
      }
    } catch (error) {
      console.error('Error en cleanup:', error);
    }
  }
};