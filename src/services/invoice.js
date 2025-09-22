// src/services/invoice.js
import api from './api.js';

export const invoiceService = {
  uploadInvoices: async (formData) => {
    const response = await api.post('/api/upload-invoices', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Mantener la función original para compatibilidad
  uploadInvoice: async (formData) => {
    const response = await api.post('/api/upload-invoice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};