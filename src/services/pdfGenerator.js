// src/services/pdfGenerator.js
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export const pdfService = {
  convertImagesToMultiPagePDF: async (images, filename = 'factura_multipagina.pdf') => {
    try {
      console.log(`📄 Convirtiendo ${images.length} imágenes a PDF multipágina: ${filename}`);
      
      // MEJORAR HTML PARA MEJOR CALIDAD
      let html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <meta charset="UTF-8">
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                background: white;
              }
              .page { 
                page-break-after: always; 
                display: flex; 
                justify-content: center; 
                align-items: flex-start;
                min-height: 95vh;
                background: white;
              }
              .page:last-child { 
                page-break-after: auto; 
              }
              img { 
                max-width: 100%; 
                height: auto;
                border: 1px solid #ddd;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              @media print {
                body { margin: 0; padding: 0; }
                .page { min-height: 100vh; }
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
            <div style="text-align: center; margin-top: 10px; font-size: 12px; color: #666;">
              Página ${index + 1} de ${images.length}
            </div>
          </div>
        `;
      });

      html += `</body></html>`;

      // GENERAR PDF CON MEJORES OPCIONES
      const { uri: pdfUri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 612,   // Tamaño carta en puntos (8.5x11 pulgadas)
        height: 792,
        margins: {
          top: 20,
          bottom: 20,
          left: 20,
          right: 20
        }
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
  }
};