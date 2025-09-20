import api from './api.js';

export const invoiceService = {
  uploadInvoice: async (formData) => {
    const response = await api.post('/api/upload-invoice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};