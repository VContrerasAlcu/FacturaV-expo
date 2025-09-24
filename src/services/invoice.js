// src/services/invoice.js
import api from './api.js';

export const invoiceService = {
  uploadInvoices: async (formData) => {
    try {
      console.log('Enviando múltiples facturas al endpoint /api/upload-invoices');
      console.log('Número de archivos en FormData:', formData._parts.length);
      
      const response = await api.post('/api/upload-invoices', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 segundos timeout
      });
      
      console.log('Respuesta recibida del servidor:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error detallado al enviar facturas:', error);
      if (error.response) {
        console.error('Respuesta de error:', error.response.data);
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
      }
      throw error;
    }
  },

  uploadInvoice: async (formData) => {
    const response = await api.post('/api/upload-invoice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};